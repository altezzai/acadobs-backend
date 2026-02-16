
const vehicleLocationUpdate = async (io, socket, data) => {
    try {
        const { route_id, latitude, longitude } = data;

        io.to(`route_${route_id}`).emit("vehicleLiveLocation", {
            latitude,
            longitude,
            updated_at: new Date(),
        });

    } catch (error) {
        console.error("Location update error:", error);
    }
};


const stopArrived = async (io, socket, data) => {
    try {
        const { route_id, stop_id, stop_name } = data;

        io.to(`route_${route_id}`).emit("stopReached", {
            route_id,
            stop_id,
            stop_name,
            reached_at: new Date(),
        });

    } catch (error) {
        console.error("Stop arrival error:", error);
    }
};

const routeCompleted = async (io, socket, data) => {
    try {
        const { route_id } = data;

        io.to(`route_${route_id}`).emit("routeFinished", {
            message: "Route completed",
            time: new Date(),
        });

    } catch (error) {
        console.error("Route complete error:", error);
    }
};

module.exports = {
    vehicleLocationUpdate,
    stopArrived,
    routeCompleted,
};
