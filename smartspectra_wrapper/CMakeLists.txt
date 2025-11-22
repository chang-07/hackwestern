# Find SmartSpectra SDK
include(../find_smartspectra.cmake)

if(NOT SmartSpectra_FOUND)
    message(FATAL_ERROR "SmartSpectra SDK not found. Please set SMARTSPECTRA_ROOT to the SDK installation directory.")
endif()

# Add the wrapper library
pybind11_add_module(tracker
    src/tracker_wrapper.cpp
)

# Include directories
target_include_directories(tracker PRIVATE
    ${PYTHON_INCLUDE_DIRS}
    ${pybind11_INCLUDE_DIRS}
    ${SMARTSPECTRA_INCLUDE_DIRS}
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

# Link against Python and SmartSpectra
target_link_libraries(tracker PRIVATE
    ${PYTHON_LIBRARIES}
    SmartSpectra::Metrics
    SmartSpectra::Core
)

# Set C++ standard and required compiler flags
target_compile_features(tracker PRIVATE cxx_std_17)

if(MSVC)
    target_compile_options(tracker PRIVATE /W4 /WX)
else()
    target_compile_options(tracker PRIVATE -Wall -Wextra -Werror)
endif()
