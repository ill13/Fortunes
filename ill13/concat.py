import os
from pathlib import Path
from datetime import datetime
import re

# Configuration lists for files and directories to ignore
IGNORED_FILES = [
    'config.php',
    'local-config.php',
    'debug.php',
    'blog.db',
    'Parsedown.php',
    'claude_concat.py',
    'sql_app.db',
    'simplemd.db',
    'README.md',
    'notes.txt',
    'pt10.py',
    '.gitignore',
    'concat.py',
    '__init__.gd',
    'mvp.css',
    "simple.min.css",
    'ill13_coding.md',
    'classless-tiny.css',
    'classless.css',
    'complaints.txt',
    'profile_samples.txt',
    'ill13_coding.md'
]

IGNORED_DIRS = [
    'logs',
    'log',
    'cache',
    'vendor',
    'node_modules',
    '.git',
    'git',
    'venv',
    '.venv',
    '__pycache__',
    '.ignore',
    'temp',
    'venv',
    '__old',
    '_old',
    'old',
    'parser',
    'shader_cache',
    '.vscode',
    'storage',
    '_stuff',
    'stuff',
    'history',
    'texttones'
    
]

# Separate extension lists for concatenation and tree generation
CONCAT_EXTENSIONS = [
    'gd',
    'tscn',
    'godot',
    'json',
    'tres',
    'py',
    'php',
    'js',
    #'png',
    'css',
    'py',
    'txt',
    'html'
]

# Additional image extensions for tree view only
TREE_EXTENSIONS = CONCAT_EXTENSIONS + [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'webp',
    'tiff',
    'svg'
]

def is_minified(filepath):
    """Check if a file appears to be minified based on common patterns"""
    filename = filepath.name.lower()
    
    # Check filename patterns for minified files
    if re.search(r'[\.-]min\.(js|css)$', filename):
        return True
    if re.search(r'[\.-]compressed\.(js|css)$', filename):
        return True
    
    # For larger files, check content
    if filepath.suffix.lower() in ['.js', '.css']:
        try:
            # Read first few lines to check for minification patterns
            with open(filepath, 'r', encoding='utf-8') as f:
                first_chunk = f.read(1024)  # Read first 1KB
                
                # Characteristics of minified files:
                if filepath.suffix.lower() == '.js':
                    if len(first_chunk.split('\n')[0]) > 500:
                        return True
                    if first_chunk.count('\n') < 3 and len(first_chunk) > 500:
                        return True
                    
                elif filepath.suffix.lower() == '.css':
                    if first_chunk.count('\n') < 3 and len(first_chunk) > 500:
                        return True
                    if re.search(r'[};][^\n\s]', first_chunk):
                        return True
                        
        except Exception:
            return False
            
    return False

def get_output_filenames():
    """Generate output filenames based on the root directory name"""
    current_dir = Path.cwd()
    root_name = current_dir.name
    
    concat_file = f"{root_name}_combined_files.txt"
    tree_file = f"{root_name}_file_tree.txt"
    
    return concat_file, tree_file

def should_ignore_file(filename, root_name=None):
    """Check if a file should be ignored based on:
    1. Exact matches in IGNORED_FILES
    2. Files that match the project's concat/tree file pattern
    """
    # Check explicit ignore list
    if filename in IGNORED_FILES:
        return True
    
    # Get current directory name if not provided
    if root_name is None:
        root_name = Path.cwd().name
    
    # Check if file matches output filename patterns
    output_patterns = [
        f"{root_name}_combined_files",
        f"{root_name}_file_tree"
    ]
    
    for pattern in output_patterns:
        if filename.startswith(pattern):
            return True
            
    return False

def should_ignore_dir(dirname):
    """Check if a directory should be ignored"""
    return dirname in IGNORED_DIRS or dirname.lower() == 'git'

def generate_file_tree(output_file):
    """Generate a tree structure of included files"""
    current_dir = Path.cwd()
    root_name = current_dir.name
    
    with open(output_file, 'w', encoding='utf-8') as treefile:
        treefile.write(f"File Tree for '{current_dir.name}' - Generated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        treefile.write(f"Included extensions: {', '.join(TREE_EXTENSIONS)}\n")
        treefile.write("=" * 50 + "\n\n")
        
        for root, dirs, files in os.walk(current_dir):
            dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
            
            relative_root = Path(root).relative_to(current_dir)
            depth = len(relative_root.parts)
            
            if depth > 0:
                treefile.write("│   " * (depth-1) + "├── " + relative_root.parts[-1] + "/\n")
            
            # Filter for included extensions and non-minified files
            included_files = []
            for f in files:
                filepath = Path(root) / f
                if (filepath.suffix.lstrip('.') in TREE_EXTENSIONS and 
                    not should_ignore_file(f, root_name) and 
                    not is_minified(filepath)):
                    included_files.append(f)
            
            included_files.sort()
            
            for file in included_files:
                treefile.write("│   " * depth + "├── " + file + "\n")

def concatenate_files(output_file):
    """Concatenate all included files into a single file"""
    current_dir = Path.cwd()
    root_name = current_dir.name
    files_processed = 0
    files_skipped = 0
    minified_skipped = 0
    
    print(f"Starting concatenation process for '{current_dir.name}'...")
    print(f"Processing extensions: {', '.join(CONCAT_EXTENSIONS)}")
    print(f"Ignoring directories: {', '.join(IGNORED_DIRS)}")
    print(f"Ignoring files: {', '.join(IGNORED_FILES)}")
    print(f"Auto-ignoring output files matching: '{root_name}_combined_files.*', '{root_name}_file_tree.*'")
    
    with open(output_file, 'w', encoding='utf-8') as outfile:
        outfile.write(f"Combined files from '{current_dir.name}'\n")
        outfile.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        outfile.write(f"Included extensions: {', '.join(CONCAT_EXTENSIONS)}\n")
        outfile.write("=" * 50 + "\n\n")
        
        for root, dirs, files in os.walk(current_dir):
            dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
            
            for file in files:
                filepath = Path(root) / file
                if filepath.suffix.lstrip('.') not in CONCAT_EXTENSIONS:
                    continue
                    
                if should_ignore_file(file, root_name):
                    print(f"Skipping ignored file: {file}")
                    files_skipped += 1
                    continue
                
                if is_minified(filepath):
                    print(f"Skipping minified file: {file}")
                    minified_skipped += 1
                    continue
                
                relative_path = filepath.relative_to(current_dir)
                
                try:
                    with open(filepath, 'r', encoding='utf-8') as infile:
                        outfile.write(f"{'=' * 50}\n")
                        outfile.write(f"FILE: {relative_path}\n")
                        outfile.write(f"{'=' * 50}\n\n")
                        
                        content = infile.read()
                        outfile.write(content)
                        outfile.write("\n\n")
                        
                        files_processed += 1
                        print(f"Processed: {relative_path}")
                
                except Exception as e:
                    print(f"Error processing {filepath}: {str(e)}")

    # Print summary
    print(f"\nConcatenation complete!")
    print(f"Files processed: {files_processed}")
    print(f"Files skipped (ignored): {files_skipped}")
    print(f"Files skipped (minified): {minified_skipped}")
    print(f"Output saved to: {output_file}")

if __name__ == "__main__":
    try:
        concat_file, tree_file = get_output_filenames()
        concatenate_files(concat_file)
        generate_file_tree(tree_file)
        print("File tree generated successfully!")
    except Exception as e:
        print(f"An error occurred: {str(e)}")