cmake_minimum_required(VERSION 3.14)
project(SmartSpectraWrapper)

# Find Python and pybind11
find_package(Python3 COMPONENTS Development REQUIRED)
find_package(pybind11 REQUIRED)

# Add the wrapper library
add_subdirectory(smartspectra_wrapper)

# Set output directory
set_target_properties(tracker PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_SOURCE_DIR}/python
)

# Install the Python module
install(TARGETS tracker
    LIBRARY DESTINATION python
)
