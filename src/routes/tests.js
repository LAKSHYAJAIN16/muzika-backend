const router = require("express").Router();

router.get("/", (req, res) => {
    res.status(200).json({
        data : "Success! Welcome to the Muzika Backend Endpoint.",
        status : 200,
        woo : req.url,
        dhs : "normal"
    })
});

router.get("/hello", (req, res) => {
    res.status(200).json({
        data : "Hello World!",
        status : 200,
        woo : req.url,
        dhs : "normal"
    })
});

router.get("/masthead", (req, res) => {
    res.status(200).json({
        data : "Created by Lakshya Jain",
        status : 200,
        woo : req.url,
        dhs : "normal"
    })
});

module.exports = router;
