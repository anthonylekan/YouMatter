const express = require('express');

const VoiceResponse = require('twilio').twiml.VoiceResponse;
const OperatorController = require('../operator/controller');

const router = express.Router();

router.post('/voice', (req, res) => {
    const { From } = req.body;
    const response = new VoiceResponse();

    response.say("You Matter! And we're here to make sure you know so.", { voice: "female" });

    OperatorController.get_available_operator(function(err, operator) {
        if(!err && operator) {
            response.say(`You are being redirect to talk to ${operator.name.split(' ')[0]}.`);
            response.dial(operator.phone_number, { action: '/end' });
            res.send(response.toString());

            OperatorController.send_sms(operator, From);
            OperatorController.mark_operator_unavailable(operator.phone_number);
        } else {
            const dial = response.dial(operator.phone_number);
            dial.queue({
                url: './queue'
            });

            res.send(response.toString());
        }
    });

});

router.post('/queue', (req, res) => {
    const response = new VoiceResponse();
    response.say("Please wait while we connect you...");

    res.send(response.toString());
});

router.post('/voice/end', (req, res) => {
    const { DialSid } = req.status;

    OperatorController.get_dail_to(DialSid, function(call) {
        const { to } = call;

        OperatorController.mark_operator_available(to);
        res.status = 200;
    });
});

module.exports = router;