"use strict";
// src/scripts/check-google-calendar.ts
/**
 * Utility script to verify Google Calendar service account connection
 * Run with: npm run ts-node src/scripts/check-google-calendar.ts
 */
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
var dotenv = require("dotenv");
var path_1 = require("path");
// Explicitly define the path to .env.local
var envPath = path_1.default.resolve(process.cwd(), '.env.local');
// Load environment variables with explicit configuration
dotenv.config({
    path: envPath,
    debug: true
});
var googleCalendar_1 = require("../utils/googleCalendar");
function checkGoogleCalendarConnection() {
    return __awaiter(this, void 0, void 0, function () {
        var serviceAccountEmail, privateKey, calendarService, roomIds, today, nextWeek, _i, roomIds_1, roomId, events, error_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🔍 Google Calendar Connection Test 🔍');
                    console.log('--------------------------------------');
                    serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
                    privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
                    console.log('Environment Variables Check:');
                    console.log("- GOOGLE_SERVICE_ACCOUNT_EMAIL: ".concat(serviceAccountEmail ? '✅ Set' : '❌ Missing'));
                    console.log("- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: ".concat(privateKey ? '✅ Set' : '❌ Missing'));
                    if (!serviceAccountEmail || !privateKey) {
                        console.error('\n❌ Error: Missing required environment variables.');
                        console.log('\nPlease set the following variables in your .env.local file:');
                        console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com');
                        console.log('- GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
                        return [2 /*return*/];
                    }
                    console.log('\nAttempting to initialize Google Calendar service...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, (0, googleCalendar_1.createAdminCalendarService)()];
                case 2:
                    calendarService = _a.sent();
                    console.log('✅ Successfully initialized Google Calendar service.');
                    roomIds = ['room1', 'room2'];
                    today = new Date();
                    nextWeek = new Date(today);
                    nextWeek.setDate(today.getDate() + 7);
                    console.log('\nTesting calendar access for each room:');
                    _i = 0, roomIds_1 = roomIds;
                    _a.label = 3;
                case 3:
                    if (!(_i < roomIds_1.length)) return [3 /*break*/, 8];
                    roomId = roomIds_1[_i];
                    _a.label = 4;
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    console.log("\nRoom ID: ".concat(roomId));
                    console.log("- Fetching events from ".concat(today.toISOString().split('T')[0], " to ").concat(nextWeek.toISOString().split('T')[0]));
                    return [4 /*yield*/, calendarService.getEvents(roomId, today, nextWeek)];
                case 5:
                    events = _a.sent();
                    console.log("\u2705 Successfully accessed calendar for ".concat(roomId));
                    console.log("- Found ".concat(events.length, " events"));
                    // List event summaries if any exist
                    if (events.length > 0) {
                        console.log('- Event summaries:');
                        events.slice(0, 5).forEach(function (event, i) {
                            var _a, _b;
                            var start = ((_a = event.start) === null || _a === void 0 ? void 0 : _a.dateTime) || ((_b = event.start) === null || _b === void 0 ? void 0 : _b.date) || 'unknown';
                            console.log("  ".concat(i + 1, ". \"").concat(event.summary || 'No title', "\" (").concat(start, ")"));
                        });
                        if (events.length > 5) {
                            console.log("  ... and ".concat(events.length - 5, " more events"));
                        }
                    }
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error("\u274C Error accessing calendar for ".concat(roomId, ":"), error_1);
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 3];
                case 8:
                    console.log('\n✅ Google Calendar connection test completed.');
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _a.sent();
                    console.error('\n❌ Failed to initialize Google Calendar service:');
                    console.error(error_2);
                    // Provide troubleshooting guidance
                    console.log('\nTroubleshooting tips:');
                    console.log('1. Verify that your service account has access to the calendars');
                    console.log('2. Check that the private key is formatted correctly with line breaks (\\n)');
                    console.log('3. Ensure the service account has the Calendar API enabled');
                    console.log('4. Make sure the calendar IDs in googleCalendar.ts are correct');
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Run the check
checkGoogleCalendarConnection().catch(console.error);
