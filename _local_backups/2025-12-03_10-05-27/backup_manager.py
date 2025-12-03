import os
import shutil
import datetime
import sys

# Configuration
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKUP_DIR = os.path.join(PROJECT_ROOT, "_local_backups")
# Folders to ignore
IGNORE_DIRS = {'.git', '.venv', 'venv', 'env', '__pycache__', '_local_backups', 'media', 'staticfiles'}
# Files to ignore
IGNORE_FILES = {'.DS_Store', 'db.sqlite3-journal'}

def ignore_func(path, names):
    return [n for n in names if n in IGNORE_DIRS or n in IGNORE_FILES]

def create_backup(message=""):
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    if message:
        folder_name = f"{timestamp}_{message.replace(' ', '_')}"
    else:
        folder_name = timestamp
    
    dest_path = os.path.join(BACKUP_DIR, folder_name)
    
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)
        
    print(f"Creating backup at: {dest_path}")
    
    try:
        shutil.copytree(PROJECT_ROOT, dest_path, ignore=shutil.ignore_patterns(*IGNORE_DIRS, *IGNORE_FILES))
        print("Backup created successfully!")
    except Exception as e:
        print(f"Error creating backup: {e}")

def list_backups():
    if not os.path.exists(BACKUP_DIR):
        print("No backups found.")
        return []
    
    backups = sorted([d for d in os.listdir(BACKUP_DIR) if os.path.isdir(os.path.join(BACKUP_DIR, d))])
    return backups

def restore_backup():
    backups = list_backups()
    if not backups:
        return

    print("\nAvailable Backups:")
    for i, b in enumerate(backups):
        print(f"{i+1}. {b}")
    
    try:
        choice_input = input("\nEnter backup number to restore (or 0 to cancel): ")
        if not choice_input.isdigit():
             print("Invalid input.")
             return
        choice = int(choice_input)
        if choice == 0:
            return
        
        if choice < 1 or choice > len(backups):
             print("Invalid selection.")
             return

        selected_backup = backups[choice - 1]
        source_path = os.path.join(BACKUP_DIR, selected_backup)
        
        confirm = input(f"WARNING: This will overwrite current files with version '{selected_backup}'.\nAre you sure? (yes/no): ")
        if confirm.lower() != 'yes':
            print("Restore cancelled.")
            return

        print("Restoring...")
        
        # Safe restore:
        # 1. Delete current files that are not ignored
        # 2. Copy from backup
        
        # Iterate over current directory
        for item in os.listdir(PROJECT_ROOT):
            if item in IGNORE_DIRS or item in IGNORE_FILES:
                continue
            
            item_path = os.path.join(PROJECT_ROOT, item)
            try:
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
            except Exception as e:
                print(f"Skipping {item}: {e}")
        
        # Copy back
        for item in os.listdir(source_path):
            s = os.path.join(source_path, item)
            d = os.path.join(PROJECT_ROOT, item)
            if os.path.isdir(s):
                shutil.copytree(s, d)
            else:
                shutil.copy2(s, d)
                
        print("Restore complete.")
        
    except Exception as e:
        print(f"Error restoring backup: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        restore_backup()
    else:
        msg = sys.argv[2] if len(sys.argv) > 2 else ""
        create_backup(msg)
