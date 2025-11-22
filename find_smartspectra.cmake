# Helper script to find SmartSpectra SDK

# Common installation paths to check
set(SMARTSPECTRA_PATHS
    /usr/local/SmartSpectra
    /opt/SmartSpectra
    $ENV{HOME}/SmartSpectra
    $ENV{HOME}/sdks/SmartSpectra
    $ENV{SMARTSPECTRA_ROOT}
)

# Find include directory
find_path(SMARTSPECTRA_INCLUDE_DIR
    NAMES SmartSpectra/Metrics/HealthTracker.h
    PATHS ${SMARTSPECTRA_PATHS}
    PATH_SUFFIXES include
    DOC "SmartSpectra SDK include directory"
)

# Find libraries
find_library(SMARTSPECTRA_LIBRARY
    NAMES SmartSpectraCore SmartSpectra
    PATHS ${SMARTSPECTRA_PATHS}
    PATH_SUFFIXES lib lib64
    DOC "SmartSpectra core library"
)

find_library(SMARTSPECTRA_METRICS_LIBRARY
    NAMES SmartSpectraMetrics
    PATHS ${SMARTSPECTRA_PATHS}
    PATH_SUFFIXES lib lib64
    DOC "SmartSpectra metrics library"
)

include(FindPackageHandleStandardArgs)
find_package_handle_standard_args(SmartSpectra
    REQUIRED_VARS 
        SMARTSPECTRA_INCLUDE_DIR 
        SMARTSPECTRA_LIBRARY
        SMARTSPECTRA_METRICS_LIBRARY
)

if(SmartSpectra_FOUND)
    set(SMARTSPECTRA_INCLUDE_DIRS ${SMARTSPECTRA_INCLUDE_DIR})
    set(SMARTSPECTRA_LIBRARIES 
        ${SMARTSPECTRA_METRICS_LIBRARY}
        ${SMARTSPECTRA_LIBRARY}
    )
    
    if(NOT TARGET SmartSpectra::Core)
        add_library(SmartSpectra::Core UNKNOWN IMPORTED)
        set_target_properties(SmartSpectra::Core PROPERTIES
            IMPORTED_LOCATION "${SMARTSPECTRA_LIBRARY}"
            INTERFACE_INCLUDE_DIRECTORIES "${SMARTSPECTRA_INCLUDE_DIR}"
        )
    endif()
    
    if(NOT TARGET SmartSpectra::Metrics)
        add_library(SmartSpectra::Metrics UNKNOWN IMPORTED)
        set_target_properties(SmartSpectra::Metrics PROPERTIES
            IMPORTED_LOCATION "${SMARTSPECTRA_METRICS_LIBRARY}"
            INTERFACE_INCLUDE_DIRECTORIES "${SMARTSPECTRA_INCLUDE_DIR}"
        )
    endif()
endif()

mark_as_advanced(
    SMARTSPECTRA_INCLUDE_DIR
    SMARTSPECTRA_LIBRARY
    SMARTSPECTRA_METRICS_LIBRARY
)
