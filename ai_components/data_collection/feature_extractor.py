"""
Facial Feature Extractor for Driver Monitoring
Extracts EAR, MAR, head pose, and occlusion features
"""
import cv2
import mediapipe as mp
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.spatial import distance
from tqdm import tqdm
import warnings
warnings.filterwarnings('ignore')


class FacialFeatureExtractor:
    """Extract geometric and temporal features from face"""
    
    # MediaPipe landmark indices
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
    MOUTH_INDICES = [61, 39, 0, 269, 291, 405, 17, 181, 84, 314, 78, 308]
    
    # Key landmarks for head pose
    NOSE_TIP = 1
    CHIN = 152
    LEFT_EYE_CORNER = 33
    RIGHT_EYE_CORNER = 263
    LEFT_MOUTH = 61
    RIGHT_MOUTH = 291
    
    def __init__(self):
        """Initialize MediaPipe Face Mesh"""
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
    
    def calculate_ear(self, eye_landmarks):
        """
        Calculate Eye Aspect Ratio
        EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        
        Low EAR indicates eye closure (drowsiness)
        Typical thresholds:
        - ALERT: EAR > 0.25
        - DROWSY: EAR < 0.20
        """
        # Vertical eye landmarks
        A = distance.euclidean(eye_landmarks[1], eye_landmarks[5])
        B = distance.euclidean(eye_landmarks[2], eye_landmarks[4])
        
        # Horizontal eye landmark
        C = distance.euclidean(eye_landmarks[0], eye_landmarks[3])
        
        # EAR formula
        if C == 0:
            return 0.0
        ear = (A + B) / (2.0 * C)
        return ear
    
    def calculate_mar(self, mouth_landmarks):
        """
        Calculate Mouth Aspect Ratio
        High MAR indicates yawning (drowsiness)
        
        Typical thresholds:
        - Normal: MAR < 0.5
        - Yawning: MAR > 0.6
        """
        # Vertical mouth distances
        A = distance.euclidean(mouth_landmarks[2], mouth_landmarks[10])
        B = distance.euclidean(mouth_landmarks[4], mouth_landmarks[8])
        C = distance.euclidean(mouth_landmarks[3], mouth_landmarks[9])
        
        # Horizontal mouth distance
        D = distance.euclidean(mouth_landmarks[0], mouth_landmarks[6])
        
        # MAR formula
        if D == 0:
            return 0.0
        mar = (A + B + C) / (3.0 * D)
        return mar
    
    def calculate_head_pose(self, landmarks, image_shape):
        """
        Calculate head pose angles (pitch, yaw, roll)
        
        Returns:
            pitch: Up/down rotation (-90 to +90 degrees)
            yaw: Left/right rotation (-90 to +90 degrees)
            roll: Head tilt (-90 to +90 degrees)
        
        Distraction thresholds:
        - |yaw| > 30° indicates looking away from road
        - |pitch| > 20° indicates looking down (e.g., at phone)
        """
        h, w = image_shape[:2]
        
        # 3D model points (generic face model)
        model_points = np.array([
            (0.0, 0.0, 0.0),           # Nose tip
            (0.0, -330.0, -65.0),      # Chin
            (-225.0, 170.0, -135.0),   # Left eye corner
            (225.0, 170.0, -135.0),    # Right eye corner
            (-150.0, -150.0, -125.0),  # Left mouth corner
            (150.0, -150.0, -125.0)    # Right mouth corner
        ], dtype=np.float64)
        
        # 2D image points from landmarks
        image_points = np.array([
            (landmarks[self.NOSE_TIP][0], landmarks[self.NOSE_TIP][1]),
            (landmarks[self.CHIN][0], landmarks[self.CHIN][1]),
            (landmarks[self.LEFT_EYE_CORNER][0], landmarks[self.LEFT_EYE_CORNER][1]),
            (landmarks[self.RIGHT_EYE_CORNER][0], landmarks[self.RIGHT_EYE_CORNER][1]),
            (landmarks[self.LEFT_MOUTH][0], landmarks[self.LEFT_MOUTH][1]),
            (landmarks[self.RIGHT_MOUTH][0], landmarks[self.RIGHT_MOUTH][1])
        ], dtype=np.float64)
        
        # Camera matrix (simplified)
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)
        
        # Assume no lens distortion
        dist_coeffs = np.zeros((4, 1))
        
        # Solve PnP
        success, rotation_vector, translation_vector = cv2.solvePnP(
            model_points, image_points, camera_matrix, dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )
        
        if not success:
            return 0.0, 0.0, 0.0
        
        # Convert rotation vector to rotation matrix
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        
        # Get Euler angles
        pose_mat = cv2.hconcat((rotation_matrix, translation_vector))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_mat)
        
        pitch = euler_angles[0][0]
        yaw = euler_angles[1][0]
        roll = euler_angles[2][0]
        
        return pitch, yaw, roll
    
    def detect_occlusion(self, image, landmarks):
        """
        Detect face occlusion (shawl, sunglasses, hand, etc.)
        
        This is CRITICAL for handling false positives in Pakistani context!
        
        Returns:
            mouth_occluded: Boolean indicating mouth region occlusion
            eyes_occluded: Boolean indicating eye region occlusion
            face_visibility: Score 0-1 indicating overall face visibility
        """
        h, w = image.shape[:2]
        
        # Extract eye region
        left_eye = landmarks[self.LEFT_EYE_CORNER]
        right_eye = landmarks[self.RIGHT_EYE_CORNER]
        eye_region = self._extract_region(image, landmarks, self.LEFT_EYE_INDICES + self.RIGHT_EYE_INDICES)
        
        # Extract mouth region
        mouth_region = self._extract_region(image, landmarks, self.MOUTH_INDICES)
        
        # Check visibility based on texture variance
        eye_visibility = self._check_texture_variance(eye_region)
        mouth_visibility = self._check_texture_variance(mouth_region)
        
        # Calculate overall face visibility
        face_visibility = (eye_visibility + mouth_visibility) / 2.0
        
        # Determine occlusion
        eyes_occluded = eye_visibility < 0.6  # Sunglasses likely
        mouth_occluded = mouth_visibility < 0.6  # Shawl/scarf likely
        
        return {
            'eyes_occluded': bool(eyes_occluded),
            'mouth_occluded': bool(mouth_occluded),
            'face_visibility_score': float(face_visibility),
            'eye_visibility': float(eye_visibility),
            'mouth_visibility': float(mouth_visibility)
        }
    
    def _extract_region(self, image, landmarks, indices):
        """Extract region of interest from landmarks"""
        h, w = image.shape[:2]
        points = landmarks[indices].astype(np.int32)
        
        # Get bounding box
        x_min = max(0, np.min(points[:, 0]) - 5)
        x_max = min(w, np.max(points[:, 0]) + 5)
        y_min = max(0, np.min(points[:, 1]) - 5)
        y_max = min(h, np.max(points[:, 1]) + 5)
        
        # Extract region
        region = image[y_min:y_max, x_min:x_max]
        
        return region
    
    def _check_texture_variance(self, region):
        """
        Check texture variance in region
        
        Low variance indicates uniform texture (potential occlusion)
        High variance indicates natural skin texture
        """
        if region.size == 0:
            return 0.0
        
        # Convert to grayscale
        if len(region.shape) == 3:
            gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
        else:
            gray = region
        
        # Calculate Laplacian variance (texture measure)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        
        # Normalize to 0-1 range (heuristic thresholds)
        # High variance (>100) = visible
        # Low variance (<50) = occluded
        visibility = min(1.0, variance / 100.0)
        
        return visibility
    
    def extract_features(self, image_path):
        """
        Extract all features from a single image
        
        Returns:
            dict with all features or None if face not detected
        """
        # Read image
        image = cv2.imread(str(image_path))
        if image is None:
            return None
        
        # Convert to RGB for MediaPipe
        rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.face_mesh.process(rgb_image)
        
        if not results.multi_face_landmarks:
            return None  # No face detected
        
        # Get landmarks
        face_landmarks = results.multi_face_landmarks[0]
        
        # Convert to numpy array
        h, w = image.shape[:2]
        landmarks = np.array([
            [lm.x * w, lm.y * h, lm.z * w]
            for lm in face_landmarks.landmark
        ])
        
        # Extract features
        features = {}
        
        # 1. Eye Aspect Ratio (EAR)
        left_eye = landmarks[self.LEFT_EYE_INDICES]
        right_eye = landmarks[self.RIGHT_EYE_INDICES]
        
        features['left_ear'] = self.calculate_ear(left_eye)
        features['right_ear'] = self.calculate_ear(right_eye)
        features['avg_ear'] = (features['left_ear'] + features['right_ear']) / 2.0
        
        # 2. Mouth Aspect Ratio (MAR)
        mouth = landmarks[self.MOUTH_INDICES]
        features['mar'] = self.calculate_mar(mouth)
        
        # 3. Head Pose
        pitch, yaw, roll = self.calculate_head_pose(landmarks, image.shape)
        features['head_pitch'] = pitch
        features['head_yaw'] = yaw
        features['head_roll'] = roll
        
        # 4. Occlusion Detection
        occlusion = self.detect_occlusion(image, landmarks)
        features.update(occlusion)
        
        # 5. Metadata
        features['image_path'] = str(image_path)
        features['image_width'] = w
        features['image_height'] = h
        
        return features
    
    def extract_from_dataset(self, dataset_path, output_csv, class_label=None):
        """
        Extract features from entire dataset
        
        Args:
            dataset_path: Path to dataset (expects ALERT/DROWSY/DISTRACTED folders)
            output_csv: Output CSV path
            class_label: Optional specific class to process
        """
        dataset_path = Path(dataset_path)
        
        # Determine classes to process
        if class_label:
            classes = [class_label]
        else:
            classes = ['ALERT', 'DROWSY', 'DISTRACTED']
        
        all_features = []
        
        print(f"🔍 Extracting features from: {dataset_path}")
        
        for class_name in classes:
            class_path = dataset_path / class_name
            
            if not class_path.exists():
                print(f"⚠️  Skipping {class_name} (not found)")
                continue
            
            # Get all images
            image_files = list(class_path.glob('*.jpg')) + \
                         list(class_path.glob('*.jpeg')) + \
                         list(class_path.glob('*.png'))
            
            print(f"\n📂 Processing {class_name}: {len(image_files)} images")
            
            # Process each image
            success_count = 0
            fail_count = 0
            
            for img_path in tqdm(image_files, desc=f"  {class_name}"):
                features = self.extract_features(img_path)
                
                if features:
                    features['class'] = class_name
                    all_features.append(features)
                    success_count += 1
                else:
                    fail_count += 1
            
            print(f"  ✅ Success: {success_count}, ❌ Failed: {fail_count}")
        
        # Save to CSV
        if all_features:
            df = pd.DataFrame(all_features)
            
            # Reorder columns for better readability
            column_order = [
                'image_path', 'class',
                'avg_ear', 'left_ear', 'right_ear',
                'mar',
                'head_pitch', 'head_yaw', 'head_roll',
                'face_visibility_score', 'eye_visibility', 'mouth_visibility',
                'eyes_occluded', 'mouth_occluded',
                'image_width', 'image_height'
            ]
            df = df[column_order]
            
            # Save
            output_path = Path(output_csv)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            df.to_csv(output_path, index=False)
            
            print(f"\n✅ Features saved to: {output_path}")
            print(f"   Total samples: {len(df)}")
            print(f"\n📊 Class distribution:")
            print(df['class'].value_counts())
            
            return df
        else:
            print("\n❌ No features extracted!")
            return None


def main():
    """Example usage"""
    extractor = FacialFeatureExtractor()
    
    print("="*60)
    print("FACIAL FEATURE EXTRACTOR")
    print("="*60)
    print("\nThis script extracts EAR, MAR, head pose, and occlusion")
    print("features from driver images.")
    print("\nUsage:")
    print("  extractor.extract_from_dataset(")
    print("      'datasets/raw/custom_pakistani/',")
    print("      'datasets/features/custom_features.csv'")
    print("  )")
    print("="*60)


if __name__ == '__main__':
    main()
