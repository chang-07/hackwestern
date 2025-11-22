#!/bin/bash
set -e

# Create build directory
mkdir -p build
cd build

# Configure with CMake
cmake ..

# Build the project
make

echo "Build complete! The Python module is in the 'python' directory."
