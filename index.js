const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/virtual-assistant', { useNewUrlParser: true, useUnifiedTopology: true });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Load appointment model
const Appointment = require('./models/appointment');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

// Socket.io communication
// Define available time slots in 15-minute increments
const timeSlots = [
    '09:00 AM', '09:15 AM', '09:30 AM', '09:45 AM',
    '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
    '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
    '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
    '01:00 PM', '01:15 PM', '01:30 PM', '01:45 PM',
    '02:00 PM', '02:15 PM', '02:30 PM', '02:45 PM',
    '03:00 PM', '03:15 PM', '03:30 PM', '03:45 PM',
    '04:00 PM', '04:15 PM', '04:30 PM', '04:45 PM',
    '05:00 PM', '05:15 PM', '05:30 PM', '05:45 PM'
];

// Handle socket.io events as before
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('clientMessage', (msg) => {
        console.log('Client says: ', msg);
        const assistantReply = handleAssistantLogic(msg);
        socket.emit('assistantReply', assistantReply);
    });

    socket.on('serviceSelected', (service) => {
        console.log('Service selected: ', service);
        socket.selectedService = service;
        socket.emit('assistantReply', 'Great choice! What date would you like to book?');
    });

    socket.on('dateSelected', (date) => {
        console.log('Date selected: ', date);
        socket.selectedDate = date;
        socket.emit('assistantReply', 'What time slot would you prefer?');
        socket.emit('timeSlots', timeSlots);
    });

    socket.on('timeSlotSelected', async (timeSlot) => {
        console.log('Time slot selected: ', timeSlot);
        socket.selectedTimeSlot = timeSlot;
        try {
            const appointment = new Appointment({
                service: socket.selectedService,
                date: socket.selectedDate,
                timeSlot: socket.selectedTimeSlot
            });
            await appointment.save();
            socket.emit('assistantReply', `You have successfully booked your appointment for ${socket.selectedDate} at ${socket.selectedTimeSlot}.`);
        } catch (err) {
            socket.emit('assistantReply', 'There was an error booking your appointment. Please try again.');
            console.error(err);
        }
    });
});


function handleAssistantLogic(message) {
    // Example virtual assistant flow
    if (message.toLowerCase().includes('hello')) {
        return 'Hello! What service would you like to book?';
    } else if (message.toLowerCase().includes('service')) {
        // This will trigger the frontend to display service buttons
        return 'Which service would you like to book?';
    }
    // Handle other messages and service selection
    return 'I didn\'t quite understand that. Can you please rephrase?';
}

// Start server
server.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
