"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
exports.createAdminCalendarService = createAdminCalendarService;
exports.createUserCalendarService = createUserCalendarService;
// src/utils/googleCalendar.ts
var googleapis_1 = require("googleapis");
var google_auth_library_1 = require("google-auth-library");
var logger_1 = require("./logger");
// Calendar IDs for each room
var CALENDAR_IDS = {
    'room1': '0300d6d6eb5334024dad813d7a111841f5d5a504311ca64091eee55f8241c72b@group.calendar.google.com',
    'room2': 'b603cdcf972a68f8fb6254ae3a9918c2aca89987cb03d5a41eae32b6f25d180c@group.calendar.google.com'
};
// Scopes required for calendar operations
var SCOPES = ['https://www.googleapis.com/auth/calendar'];
var GoogleCalendarService = /** @class */ (function () {
    function GoogleCalendarService(authClient) {
        this.auth = null;
        this.auth = authClient;
    }
    // Get calendar ID for a specific room
    GoogleCalendarService.prototype.getCalendarId = function (roomId) {
        return CALENDAR_IDS[roomId] || '';
    };
    // Create a calendar event for a booking
    GoogleCalendarService.prototype.createEvent = function (roomId, booking) {
        return __awaiter(this, void 0, void 0, function () {
            var calendar, calendarId, event_1, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.auth) {
                            throw new Error('Authentication client not initialized');
                        }
                        calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.auth });
                        calendarId = this.getCalendarId(roomId);
                        if (!calendarId) {
                            throw new Error("No calendar ID found for room: ".concat(roomId));
                        }
                        event_1 = {
                            summary: "Reserva - ".concat(booking.clientName),
                            description: "Reserva para ".concat(booking.clientName, ". Contacto: ").concat(booking.email, "."),
                            start: {
                                dateTime: booking.startTime.toISOString(),
                                timeZone: 'America/Costa_Rica',
                            },
                            end: {
                                dateTime: booking.endTime.toISOString(),
                                timeZone: 'America/Costa_Rica',
                            },
                            extendedProperties: {
                                private: {
                                    bookingId: booking._id.toString(),
                                    clientEmail: booking.email,
                                },
                            },
                        };
                        return [4 /*yield*/, calendar.events.insert({
                                calendarId: calendarId,
                                requestBody: event_1,
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                eventId: response.data.id,
                                htmlLink: response.data.htmlLink,
                            }];
                    case 2:
                        error_1 = _a.sent();
                        (0, logger_1.logToConsole)('error', 'Error creating calendar event:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Update an existing calendar event
    GoogleCalendarService.prototype.updateEvent = function (roomId, eventId, booking) {
        return __awaiter(this, void 0, void 0, function () {
            var calendar, calendarId, existingEvent, updatedEvent, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (!this.auth) {
                            throw new Error('Authentication client not initialized');
                        }
                        calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.auth });
                        calendarId = this.getCalendarId(roomId);
                        if (!calendarId) {
                            throw new Error("No calendar ID found for room: ".concat(roomId));
                        }
                        return [4 /*yield*/, calendar.events.get({
                                calendarId: calendarId,
                                eventId: eventId,
                            })];
                    case 1:
                        existingEvent = _a.sent();
                        updatedEvent = __assign(__assign({}, existingEvent.data), { summary: "Reserva - ".concat(booking.clientName), description: "Reserva para ".concat(booking.clientName, ". Contacto: ").concat(booking.email, "."), start: {
                                dateTime: booking.startTime.toISOString(),
                                timeZone: 'America/Costa_Rica',
                            }, end: {
                                dateTime: booking.endTime.toISOString(),
                                timeZone: 'America/Costa_Rica',
                            } });
                        return [4 /*yield*/, calendar.events.update({
                                calendarId: calendarId,
                                eventId: eventId,
                                requestBody: updatedEvent,
                            })];
                    case 2:
                        response = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                eventId: response.data.id,
                                htmlLink: response.data.htmlLink,
                            }];
                    case 3:
                        error_2 = _a.sent();
                        (0, logger_1.logToConsole)('error', 'Error updating calendar event:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Delete a calendar event
    GoogleCalendarService.prototype.deleteEvent = function (roomId, eventId) {
        return __awaiter(this, void 0, void 0, function () {
            var calendar, calendarId, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        if (!this.auth) {
                            throw new Error('Authentication client not initialized');
                        }
                        calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.auth });
                        calendarId = this.getCalendarId(roomId);
                        if (!calendarId) {
                            throw new Error("No calendar ID found for room: ".concat(roomId));
                        }
                        return [4 /*yield*/, calendar.events.delete({
                                calendarId: calendarId,
                                eventId: eventId,
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                    case 2:
                        error_3 = _a.sent();
                        (0, logger_1.logToConsole)('error', 'Error deleting calendar event:', error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get events for a specific room and date range
    GoogleCalendarService.prototype.getEvents = function (roomId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function () {
            var calendar, calendarId, response, processedEvents, error_4;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        if (!this.auth) {
                            throw new Error('Authentication client not initialized');
                        }
                        calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.auth });
                        calendarId = this.getCalendarId(roomId);
                        if (!calendarId) {
                            throw new Error("No calendar ID found for room: ".concat(roomId));
                        }
                        (0, logger_1.logToConsole)('info', "Fetching events for room ".concat(roomId, " from ").concat(startDate.toISOString(), " to ").concat(endDate.toISOString()));
                        return [4 /*yield*/, calendar.events.list({
                                calendarId: calendarId,
                                timeMin: startDate.toISOString(),
                                timeMax: endDate.toISOString(),
                                singleEvents: true,
                                orderBy: 'startTime',
                            })];
                    case 1:
                        response = _b.sent();
                        (0, logger_1.logToConsole)('info', "Found ".concat(((_a = response.data.items) === null || _a === void 0 ? void 0 : _a.length) || 0, " events for room ").concat(roomId));
                        processedEvents = (response.data.items || []).map(function (event) {
                            // Ensure start and end have valid dateTime or date values
                            if (!event.start)
                                event.start = { dateTime: startDate.toISOString() };
                            if (!event.end)
                                event.end = { dateTime: new Date(startDate.getTime() + 3600000).toISOString() };
                            // Ensure dateTime exists (use date as fallback)
                            if (!event.start.dateTime && event.start.date)
                                event.start.dateTime = new Date(event.start.date).toISOString();
                            if (!event.end.dateTime && event.end.date)
                                event.end.dateTime = new Date(event.end.date).toISOString();
                            return event;
                        });
                        return [2 /*return*/, processedEvents];
                    case 2:
                        error_4 = _b.sent();
                        (0, logger_1.logToConsole)('error', "Error fetching calendar events for room ".concat(roomId, ":"), error_4);
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return GoogleCalendarService;
}());
exports.GoogleCalendarService = GoogleCalendarService;
// Create a service with server-side credentials
function createAdminCalendarService() {
    return __awaiter(this, void 0, void 0, function () {
        var clientEmail, privateKey, jwtClient, error_5;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
                    privateKey = (_a = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n');
                    if (!clientEmail || !privateKey) {
                        (0, logger_1.logToConsole)('error', 'Google service account credentials not found in environment variables', {
                            clientEmail: clientEmail ? 'SET' : 'NOT SET',
                            privateKey: privateKey ? 'SET (length: ' + privateKey.length + ')' : 'NOT SET'
                        });
                        throw new Error('Google service account credentials not properly configured');
                    }
                    jwtClient = new google_auth_library_1.JWT({
                        email: clientEmail,
                        key: privateKey,
                        scopes: SCOPES,
                    });
                    // Verify credentials by requesting an access token
                    (0, logger_1.logToConsole)('info', 'Initializing Google Calendar service with JWT client');
                    return [4 /*yield*/, jwtClient.authorize()];
                case 1:
                    _b.sent();
                    (0, logger_1.logToConsole)('info', 'JWT client authorization successful');
                    return [2 /*return*/, new GoogleCalendarService(jwtClient)];
                case 2:
                    error_5 = _b.sent();
                    (0, logger_1.logToConsole)('error', 'Error creating admin calendar service:', error_5);
                    throw error_5;
                case 3: return [2 /*return*/];
            }
        });
    });
}
// Create a service with user OAuth token for client-side operations
function createUserCalendarService(accessToken) {
    var _a;
    try {
        // Create JWT client with access token
        var jwtClient = new google_auth_library_1.JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: (_a = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY) === null || _a === void 0 ? void 0 : _a.replace(/\\n/g, '\n'),
            scopes: SCOPES,
            subject: accessToken // Impersonate the user
        });
        return new GoogleCalendarService(jwtClient);
    }
    catch (error) {
        (0, logger_1.logToConsole)('error', 'Error creating user calendar service:', error);
        throw error;
    }
}
