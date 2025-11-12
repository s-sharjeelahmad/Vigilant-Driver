"""
Quick Start Script for Custom Data Collection
==============================================
Run this script to start collecting data from your laptop camera.

Usage:
    python collect_data.py
"""

from ai_components.data_collection.training_data_collector import TrainingDataCollector
from datetime import datetime

def main():
    print("\n" + "="*70)
    print("VIGILANT DRIVER - CUSTOM DATA COLLECTOR")
    print("="*70)
    print("Collect training data for Pakistani driver context!")
    print("="*70 + "\n")
    
    print("INSTRUCTIONS:")
    print("1. Position yourself in front of the camera")
    print("2. Press 1, 2, or 3 to set the label (Alert/Drowsy/Distracted)")
    print("3. Press C to capture single frames OR A for auto-capture")
    print("4. Press SPACE to pause and change your pose/condition")
    print("5. Press Q when done\n")
    
    # Initialize collector
    collector = TrainingDataCollector()
    
    # Get session name
    print("Session Name Examples:")
    print("  - morning_session")
    print("  - with_shawl_bright_light")
    print("  - night_driving_test")
    print()
    
    session_name = input("Enter session name (or press Enter for default): ").strip()
    if not session_name:
        session_name = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    
    # Start session
    session_dir = collector.start_collection_session(session_name)
    print(f"\n✓ Session started: {session_dir}\n")
    
    # Camera settings
    camera_id = 0  # Default laptop camera (change to 1 if you have multiple cameras)
    fps = 5  # Capture rate
    
    try:
        print("Starting camera...\n")
        print("TIP: Start with ALERT state, capture 50-100 samples")
        print("     Then pause (SPACE), adjust to DROWSY, capture 50-100 samples")
        print("     Finally pause again, adjust to DISTRACTED, capture 50-100 samples\n")
        
        input("Press Enter to start camera...")
        print()
        
        # Start camera collection
        stats = collector.collect_from_camera(camera_id=camera_id, fps=fps)
        
        # Print final stats
        print("\n" + "="*70)
        print("COLLECTION COMPLETE!")
        print("="*70)
        print(f"Total samples saved: {stats.get('samples_saved', 0)}")
        print(f"Session directory: {session_dir}")
        
        # Show label distribution
        final_stats = collector.get_collection_stats()
        if final_stats['label_distribution']:
            print("\nLabel Distribution:")
            for label, count in final_stats['label_distribution'].items():
                print(f"  {label}: {count} samples")
            
            # Show recommendations
            print("\nRECOMMENDATIONS:")
            total = sum(final_stats['label_distribution'].values())
            for label in ['ALERT', 'DROWSY', 'DISTRACTED']:
                count = final_stats['label_distribution'].get(label, 0)
                if count < 50:
                    print(f"  ⚠ {label}: Collect more samples (target: 100+ per session)")
                elif count >= 50 and count < 100:
                    print(f"  ⚡ {label}: Good! Consider collecting more for better results")
                else:
                    print(f"  ✓ {label}: Excellent!")
        
        print("="*70 + "\n")
        
    except KeyboardInterrupt:
        print("\n\n⚠ Interrupted by user")
    except Exception as e:
        print(f"\n⚠ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # End session and save metadata
        collector.end_collection_session()
        print("✓ Session saved successfully!")
        print(f"✓ Data saved to: {session_dir}\n")


if __name__ == "__main__":
    main()
