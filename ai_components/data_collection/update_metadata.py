import json
import pandas as pd
import os

def update_metadata():
    # Paths (adjust if running from a different directory)
    metadata_path = 'datasets/processed/merged_final_cropped/crop_metadata.json'
    csv_path = 'datasets/processed/merged_final_cropped/training_features.csv'
    output_path = 'datasets/processed/merged_final_cropped/final_metadata.json'

    # Load original metadata and CSV
    with open(metadata_path, 'r') as f:
        meta = json.load(f)
    
    df = pd.read_csv(csv_path)

    # Calculate global drops
    new_total_saved = len(df) # Should be 119313
    extraction_failures = meta['stats']['saved'] - new_total_saved
    
    # Update global stats
    meta['stats']['final_saved'] = new_total_saved
    meta['stats']['feature_extraction_failures'] = extraction_failures
    meta['stats']['final_save_rate_percent'] = round((new_total_saved / meta['stats']['processed']) * 100, 4)

    # Class Mapping (0=ALERT, 1=DISTRACTED, 2=DROWSY)
    class_map = {0: "ALERT", 1: "DISTRACTED", 2: "DROWSY"}
    class_counts = df['class_label'].value_counts().to_dict()

    # Update per-class stats
    for class_val, class_name in class_map.items():
        final_count = class_counts.get(class_val, 0)
        orig_saved = meta['stats']['per_class'][class_name]['saved']
        class_extraction_failed = orig_saved - final_count
        
        meta['stats']['per_class'][class_name]['final_saved'] = final_count
        meta['stats']['per_class'][class_name]['feature_extraction_failed'] = class_extraction_failed

    # Save the synchronized metadata
    with open(output_path, 'w') as f:
        json.dump(meta, f, indent=2)
    
    print(f"Metadata updated successfully! Final images: {new_total_saved}")
    print(f"Saved to: {output_path}")

if __name__ == "__main__":
    update_metadata()