const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    name: String,
    email: String,
    service: String,
    date: Date,
    time: String,
    contact: String
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
