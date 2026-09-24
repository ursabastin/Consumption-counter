import os
import zipfile
import shutil

def package_extension():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    primary_zip = os.path.join(base_dir, "consumption-counter.zip")
    legacy_zip = os.path.join(base_dir, "youtube-consumption-counter.zip")
    
    # Remove old zips if present
    for z in [primary_zip, legacy_zip]:
        if os.path.exists(z):
            os.remove(z)

    # Files to include (manifest and root files)
    root_files = [
        "manifest.json",
        "background.js",
        "content.js",
        "content.css",
        "popup.html",
        "popup.css",
        "popup.js",
        "dashboard.html",
        "dashboard.css",
        "dashboard.js",
        "index.html"
    ]

    # Folders to include
    sub_folders = [
        "icons",
        "utils"
    ]

    with zipfile.ZipFile(primary_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Add root files
        for f in root_files:
            file_path = os.path.join(base_dir, f)
            if os.path.exists(file_path):
                # zip entries MUST use forward slash
                zipf.write(file_path, arcname=f)
                print(f"Added: {f}")

        # Add subfolders recursively with forward slashes
        for folder in sub_folders:
            folder_path = os.path.join(base_dir, folder)
            if os.path.exists(folder_path):
                for root, _, files in os.walk(folder_path):
                    for file in files:
                        full_path = os.path.join(root, file)
                        rel_path = os.path.relpath(full_path, base_dir)
                        # Normalize to forward slash for standard ZIP compliance!
                        arcname = rel_path.replace(os.sep, '/')
                        zipf.write(full_path, arcname=arcname)
                        print(f"Added: {arcname}")

    # Copy to legacy name for compatibility
    shutil.copyfile(primary_zip, legacy_zip)

    print(f"\n[SUCCESS] Packaged to: {primary_zip}")
    print(f"Archive Size: {round(os.path.getsize(primary_zip) / 1024, 2)} KB")
    print(f"[COMPATIBILITY] Also updated: {legacy_zip}")

if __name__ == "__main__":
    package_extension()
