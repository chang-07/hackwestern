#include <pybind11/pybind11.h>
#include <pybind11/numpy.h>
#include <pybind11/stl.h>
#include <vector>
#include <string>
#include <memory>
#include <chrono>
#include <map>

// Include the actual SmartSpectra SDK headers
#include <SmartSpectra/Metrics/HealthTracker.h>
#include <SmartSpectra/Core/Frame.h>
#include <SmartSpectra/Core/Error.h>

using namespace SmartSpectra;

namespace py = pybind11;

class PyHealthTracker {
public:
    PyHealthTracker() {
        tracker = std::make_unique<SmartSpectra::HealthTracker>();
    }

    void add_frame(py::array_t<uint8_t>& input) {
        // Get buffer info from numpy array
        py::buffer_info buf = input.request();
        
        // Verify input is a 3D array (height, width, channels)
        if (buf.ndim != 3 || buf.shape[2] != 3) {
            throw std::runtime_error("Expected RGB image with shape (H, W, 3)");
        }

        // Get dimensions
        int height = buf.shape[0];
        int width = buf.shape[1];
        
        // Create SDK-compatible frame
        Frame frame;
        frame.setDimensions(width, height);
        frame.setData(static_cast<uint8_t*>(buf.ptr));
        frame.setFormat(Frame::Format::RGB);

        try {
            // Process the frame
            auto metrics = tracker->processFrame(frame);
            
            // Store metrics
            session_data.push_back({
                {"heart_rate", metrics.getHeartRate()},
                {"breathing_rate", metrics.getBreathingRate()},
                {"spo2", metrics.getSpO2()},  // If available in your SDK version
                {"timestamp", std::chrono::system_clock::now().time_since_epoch().count()}
            });
        } catch (const Error& e) {
            std::cerr << "Error processing frame: " << e.what() << std::endl;
            // Store error information
            session_data.push_back({
                {"error", 1},
                {"message", std::string(e.what())},
                {"timestamp", std::chrono::system_clock::now().time_since_epoch().count()}
            });
        }
    }

    std::vector<std::map<std::string, double>> get_session_data() {
        return session_data;
    }

private:
    std::unique_ptr<SmartSpectra::HealthTracker> tracker;
    std::vector<std::map<std::string, double>> session_data;
};

// Python module definition
PYBIND11_MODULE(tracker, m) {
    py::class_<PyHealthTracker>(m, "HealthTracker")
        .def(py::init<>())
        .def("add_frame", &PyHealthTracker::add_frame, "Process a frame")
        .def("get_session_data", &PyHealthTracker::get_session_data, "Get all session metrics");
}
