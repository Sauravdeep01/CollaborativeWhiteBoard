// Sample Controller
export const getStatus = (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: "API is working perfectly!",
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong while checking status"
        });
    }
};
