"""
Review Low Visibility Images - Identify False Positive Cases
(Jury Requirement: Handle shawl/sunglasses occlusion)
"""
import pandas as pd
from pathlib import Path
import shutil

def review_low_visibility_images():
    """Find and organize images with low face visibility for manual review"""
    
    print("="*70)
    print("OCCLUSION DETECTION REVIEW")
    print("="*70)
    
    # Load features
    features_csv = Path("datasets/features/custom_pakistani_features.csv")
    
    if not features_csv.exists():
        print("❌ Features CSV not found!")
        print("   Run: python process_custom_dataset.py")
        return
    
    df = pd.read_csv(features_csv)
    
    print(f"\n📊 Total images processed: {len(df)}")
    print(f"\n📊 Face Visibility Score Distribution:")
    print(f"   High visibility (>0.7):     {len(df[df['face_visibility_score'] > 0.7])} images")
    print(f"   Medium visibility (0.4-0.7): {len(df[(df['face_visibility_score'] >= 0.4) & (df['face_visibility_score'] <= 0.7)])} images")
    print(f"   Low visibility (<0.4):       {len(df[df['face_visibility_score'] < 0.4])} images")
    
    # Find low visibility images
    low_vis_threshold = 0.6
    low_vis = df[df['face_visibility_score'] < low_vis_threshold].sort_values('face_visibility_score')
    
    print(f"\n🔍 Images with visibility < {low_vis_threshold}: {len(low_vis)}")
    
    if len(low_vis) == 0:
        print("\n✅ No low visibility images found!")
        print("   This means your dataset has good face detection.")
        return
    
    # Create review folder
    review_dir = Path("datasets/annotations/occlusion_review")
    review_dir.mkdir(parents=True, exist_ok=True)
    
    # Organize by class
    print(f"\n📁 Copying low visibility images to: {review_dir}")
    
    stats = {'ALERT': 0, 'DROWSY': 0, 'DISTRACTED': 0}
    
    for idx, row in low_vis.iterrows():
        src_path = Path(row['image_path'])
        class_name = row['class']
        visibility = row['face_visibility_score']
        
        # Create class subfolder
        class_dir = review_dir / class_name
        class_dir.mkdir(exist_ok=True)
        
        # Copy with visibility score in filename
        new_name = f"vis_{visibility:.3f}_{src_path.name}"
        dest_path = class_dir / new_name
        
        if src_path.exists():
            shutil.copy2(src_path, dest_path)
            stats[class_name] += 1
    
    print(f"\n✅ Copied {sum(stats.values())} images:")
    for class_name, count in stats.items():
        print(f"   {class_name}: {count} images")
    
    # Print top 20 lowest visibility for quick inspection
    print(f"\n📋 Top 20 Lowest Visibility Images:")
    print(f"{'Image':<60} {'Class':<12} {'Visibility':<10}")
    print("-"*85)
    
    for idx, row in low_vis.head(20).iterrows():
        img_name = Path(row['image_path']).name[:50]
        print(f"{img_name:<60} {row['class']:<12} {row['face_visibility_score']:<10.3f}")
    
    # Occlusion flags summary
    print(f"\n📊 Occlusion Detection Summary:")
    eyes_occluded = df['eyes_occluded'].sum()
    mouth_occluded = df['mouth_occluded'].sum()
    print(f"   Eyes occluded:  {eyes_occluded} images ({eyes_occluded/len(df)*100:.1f}%)")
    print(f"   Mouth occluded: {mouth_occluded} images ({mouth_occluded/len(df)*100:.1f}%)")
    
    # Check per class
    print(f"\n📊 Low Visibility by Class:")
    for class_name in ['ALERT', 'DROWSY', 'DISTRACTED']:
        class_df = df[df['class'] == class_name]
        low_vis_class = class_df[class_df['face_visibility_score'] < low_vis_threshold]
        percentage = len(low_vis_class) / len(class_df) * 100 if len(class_df) > 0 else 0
        print(f"   {class_name}: {len(low_vis_class)}/{len(class_df)} ({percentage:.1f}%)")
    
    print(f"\n{'='*70}")
    print(f"NEXT STEPS")
    print(f"{'='*70}")
    print(f"\n1. Review images in: {review_dir}")
    print(f"   - Check if they are actually occluded (shawl, sunglasses, hand)")
    print(f"   - Or if they are just poor lighting/angle")
    print(f"\n2. Create labeled subset:")
    print(f"   - Create folders: datasets/annotations/occlusion_labeled/")
    print(f"     - true_occlusion/  (actually occluded)")
    print(f"     - false_detection/ (not occluded, just low quality)")
    print(f"\n3. Give to Abrar:")
    print(f"   - This labeled data helps fine-tune false positive detection")
    print(f"   - Model can learn when to reduce confidence vs when to reject image")
    print(f"\n4. For FYP Report:")
    print(f"   - Document occlusion detection rate: {eyes_occluded + mouth_occluded} images")
    print(f"   - Show example images (before/after false positive handling)")
    print(f"   - Explain how visibility score reduces alert confidence")

def analyze_ear_mar_by_visibility():
    """Analyze if EAR/MAR are reliable in low visibility images"""
    
    features_csv = Path("datasets/features/custom_pakistani_features.csv")
    if not features_csv.exists():
        return
    
    df = pd.read_csv(features_csv)
    
    print(f"\n📊 EAR/MAR Reliability by Visibility:")
    print(f"\n{'Visibility Range':<20} {'Count':<10} {'Avg EAR':<12} {'Avg MAR':<12}")
    print("-"*55)
    
    ranges = [
        ("High (>0.7)", df[df['face_visibility_score'] > 0.7]),
        ("Medium (0.4-0.7)", df[(df['face_visibility_score'] >= 0.4) & (df['face_visibility_score'] <= 0.7)]),
        ("Low (<0.4)", df[df['face_visibility_score'] < 0.4])
    ]
    
    for label, subset in ranges:
        if len(subset) > 0:
            avg_ear = subset['avg_ear'].mean()
            avg_mar = subset['mar'].mean()
            print(f"{label:<20} {len(subset):<10} {avg_ear:<12.3f} {avg_mar:<12.3f}")


if __name__ == '__main__':
    review_low_visibility_images()
    analyze_ear_mar_by_visibility()
