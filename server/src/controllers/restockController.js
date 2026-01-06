exports.getMyPendingRestocks = async (_req, res) => {
    res.json([]);
};

exports.confirmRestock = async (_req, res) => {
    res.status(410).json({ error: 'deprecated' });
};
