'use strict';

(function() {
    
    const MIN_YEAR = 1900;
    const MAX_YEAR = 2100;
    // Taken from Sejmometr logo.
    const DEFAULT_COLORS = ['#62bb46', '#0099da', '#fdb924', '#e23d40', '#993f98',
        '#4a9536', '#f79433', '#b55594'];

    /**
     * Calendar able to:
     * - draw multiple monthly displays
     * - responsively increase / decrease the number of months shown
     * - display events happening during the shown months, handling event overlap
     * - move forward / back to previous / following months
     * - run a callback when user clicks on a given event
     *
     * @param {Object} config the configuration object. Properties are listed below.
     * @param {string} config.containerId (required) the id of the HTML element to insert 
     *     the calendar into.
     * @param {Number} config.month (optional) the month to display right off, in range 0-11. If
     *     not provided, displays current month.
     * @param {Number} config.year (optional) the year to display right off. If not provided,
     *     displays current year.
     * @param {Object} config.range (optional) limits on how far back/forward user can go on the
     *     calendar. If not provided, there's no limit.
     * @param {Number} config.range.backLimitMonth (optional) month beyond which the user can't go 
     *     back, in range 0-11. If not provided and backLimitYear is provided, defaults to 0.
     * @param {Number} config.range.backLimitYear (optional) year beyond which the user can't go 
     *     back. If not provided and backLimitMonth is provided, defaults to last year.
     * @param {Number} config.range.forwardLimitMonth (optional) month beyond which the user can't
     *     go forward, in range 0-11. If not provided and forwardLimitYear is provided,
     *     defaults to 11.
     * @param {Number} config.range.forwardLimitYear (optional) year beyond which the user can't go 
     *     back. If not provided and forwardLimitMonth is provided, defaults to next year.     
     * @param {array} config.events (optional) an array of events, each being an array containing: 
     *     id (number), title (string), range (array of arrays, each with two Dates),
     *     hasHiddenDisplay (boolean), dataForCallback (mixed). hasHiddenDisplay set to true
     *     means that we don't render little <div>'s indicating the event. Clicking a day with a 
     *     hidden event still invokes the event's handler. A day with a hidden event must not have
     *     any other event. If config.events param is not provided, an empty array is used.
     * @param {function} config.eventClickCallback (optional) a function executed when user 
     *     clicks on the display of an event. The data passed to it is the fourth parameter 
     *     in the array representing an event. If not provided, a no-op is exectuted.
     * @param {Number} config.weekStartsOn (optional) the number of day on which 
     *     each displayed week should start. Can be 0-6, where 0 means Sunday and 6 means Saturday.
     *     If not provided, defaults to Sunday.
     * @param {string} config.eventIndicatorStyle (optional) whether to display event indicator
     *     <div>s as little bars or dots. Accepts either 'bars' or 'dots'. If not provided, defaults
     *     to 'bars'.
     * @param {array} config.eventColors (optional) a list of colors, in hex notation 
     *     (e.g. '#ffffff') that will be used to render event indicators. If not provided, defaults
     *     to DEFAULT_COLORS constant.
     * @returns {MultiMonthCalendar} an instance of the calendar.
     */
    var MultiMonthCalendar = function (config) {
        this.validateAndFillInConfig(config);
        
        this.containerId = config.containerId;
        this.start = new MonthYear(config.month, config.year);
        this.backLimit = new MonthYear(config.range.backLimitMonth, config.range.backLimitYear);
        this.forwardLimit = 
                new MonthYear(config.range.forwardLimitMonth, config.range.forwardLimitYear);
        this.count = 1;
        this.daysShort = ["N", "P", "W", "Ś", "C", "P", "S"];
        this.monthNames = [
            "Styczeń",
            "Luty",
            "Marzec",
            "Kwiecień",
            "Maj",
            "Czerwiec",
            "Lipiec",
            "Sierpień",
            "Wrzesień",
            "Październik",
            "Listopad",
            "Grudzień"
        ];
        this.eventColors = config.eventColors;
        this.eventList = this.parseEvents(config.events);
        this.eventList.sort();
        this.callback = config.eventClickCallback;
        this.weekStartsOn = config.weekStartsOn;
        this.eventIndicatorStyle = config.eventIndicatorStyle;
        // Breakpoints around which number of months shown can change. Must be increasing.
        // Calculated like this:
        // - each of the two navs has about 5px for the left/right symbol plus 16px horizontal 
        //   padding,
        // - each month's calendar seems to have 273px plus 30px horizontal margin.
        // So:
        // - two months start to fit at: 2 x (5 + 16 + 16) + 2 x (273 + 30 + 30) = 740,
        // - three months start to fit at: 2 x (5 + 16 + 16) + 3 x (273 + 30 + 30) = 1073.
        this.breakpoints = [750, 1080];
        // Number of these should be number of breakpoints + 1. The first number
        // is used when window width is below 1st breakpoint; the second number
        // is used when window width is b/n 1st and 2nd breakpoint, etc. Must be increasing.
        this.numMonthsAroundBreakpoints = [1, 2, 3];
        this.lastContainerWidth = 0; // Initial resizeCallback call below will set it.

        // "_this" trick is needed b/c when resize callback is called, "this"
        // refers to the window object.
        var _this = this;
        window.addEventListener("resize", function () {
            _this.resizeCallback(_this);
        });

        this.renderCalendar();
        this.resizeCallback(this);
    };

    /**
     * Checks that the config object contains the required properties and throws exceptions
     * if it doesn't. For any optional properties which are not present, fills them in with
     * defaults.
     *
     * @param {Object} config the main configuration object.
     * @returns {void}
     */
    MultiMonthCalendar.prototype.validateAndFillInConfig = function (config) {
        if ((config === null) || (typeof config !== 'object')) {
            throw 'The "config" param must be a non-null object.';
        }
        if (!config.hasOwnProperty('containerId') || (typeof config.containerId !== 'string')
                || (config.containerId.length === 0)) {
            throw 'The "config.containerId" param must be present and a non-empty string.';
        }
        if (config.hasOwnProperty('month')) {
            if ((typeof config.month !== 'number') || ((config.month % 1) !== 0) 
                    || (config.month < 0) || (config.month > 11)) {
                throw 'The "config.month" param must be an int in the range 0-11.';
            }
        } else {
            config.month = new Date().getMonth();
        }
        if (config.hasOwnProperty('year')) {
            if ((typeof config.year !== 'number') || ((config.year % 1) !== 0) 
                    || (config.year < MIN_YEAR) || (config.year > MAX_YEAR)) {
                throw 'The "config.year" param must be an int in the range 1900-2100.';
            }
        } else {
            config.year = new Date().getFullYear();
        }
        if (!config.hasOwnProperty('range')) {
            config.range = {};
        }
        if ((config.range === null) || (typeof config.range !== 'object')) {
            throw 'The "config.range" param must be a non-null object.';
        }
        if (config.range.hasOwnProperty('backLimitMonth')) {
            if ((typeof config.range.backLimitMonth !== 'number') 
                    || ((config.range.backLimitMonth % 1) !== 0) 
                    || (config.range.backLimitMonth < 0) 
                    || (config.range.backLimitMonth > 11)) {
                throw 'The "config.range.backLimitMonth" param must be an int in the range 0-11.';
            }
        }
        if (config.range.hasOwnProperty('backLimitYear')) {
            if ((typeof config.range.backLimitYear !== 'number') 
                    || ((config.range.backLimitYear % 1) !== 0) 
                    || (config.range.backLimitYear < MIN_YEAR) 
                    || (config.range.backLimitYear > MAX_YEAR)) {
                throw 'The "config.range.backLimitYear" param must be an int in ' 
                        + 'the range 1900-2100.';
            }
        }
        if (config.range.hasOwnProperty('forwardLimitMonth')) {
            if ((typeof config.range.forwardLimitMonth !== 'number') 
                    || ((config.range.forwardLimitMonth % 1) !== 0) 
                    || (config.range.forwardLimitMonth < 0) 
                    || (config.range.forwardLimitMonth > 11)) {
                throw 'The "config.range.forwardLimitMonth" param must be int in the range 0-11.';
            }
        }
        if (config.range.hasOwnProperty('forwardLimitYear')) {
            if ((typeof config.range.forwardLimitYear !== 'number') 
                    || ((config.range.forwardLimitYear % 1) !== 0) 
                    || (config.range.forwardLimitYear < MIN_YEAR) 
                    || (config.range.forwardLimitYear > MAX_YEAR)) {
                throw 'The "config.range.forwardLimitYear" param must be an int in ' 
                        + 'the range 1900-2100.';
            }
        }
        if (!config.range.hasOwnProperty('backLimitYear') 
                && !config.range.hasOwnProperty('backLimitMonth')) {
            config.range.backLimitYear = MIN_YEAR;
        }            
        if (config.range.hasOwnProperty('backLimitYear') 
                && !config.range.hasOwnProperty('backLimitMonth')) {
            config.range.backLimitMonth = 0;                
        }
        if (config.range.hasOwnProperty('backLimitMonth') 
                && !config.range.hasOwnProperty('backLimitYear')) {
            config.range.backLimitYear = new Date().getFullYear() - 1;
        }
        if (!config.range.hasOwnProperty('forwardLimitYear') 
                && !config.range.hasOwnProperty('forwardLimitMonth')) {
            config.range.forwardLimitYear = MAX_YEAR;
        }
        if (config.range.hasOwnProperty('forwardLimitYear') 
                && !config.range.hasOwnProperty('forwardLimitMonth')) {
            config.range.forwardLimitMonth = 11;
        }
        if (config.range.hasOwnProperty('forwardLimitMonth') 
                && !config.range.hasOwnProperty('forwardLimitYear')) {
            config.range.forwardLimitYear = new Date().getFullYear() + 1;
        }
        var start = new MonthYear(config.month, config.year);
        var backLimit = new MonthYear(config.range.backLimitMonth, config.range.backLimitYear);
        var forwardLimit = 
                new MonthYear(config.range.forwardLimitMonth, config.range.forwardLimitYear);
        if (MonthYear.compare(backLimit, start) > 0) {
            throw 'Start month-year is before the back limit.';
        }
        if (MonthYear.compare(start, forwardLimit) > 0) {
            throw 'Start month-year is after the forward limit.';
        }        
        if (config.hasOwnProperty('events')) {
            if (!Array.isArray(config.events)) {
                throw 'The "config.events" param must be an array.';
            }
        } else {
            config.events = [];
        }
        if (config.hasOwnProperty('eventClickCallback')) {
            if ((typeof config.eventClickCallback !== 'function') 
                    || (config.eventClickCallback.length !== 1)) {
                throw 'The "config.eventClickCallback" param must be a one-argument function.';
            }
        } else {
            config.eventClickCallback = function (_) {};
        }
        if (config.hasOwnProperty('weekStartsOn')) {
            if ((typeof config.weekStartsOn !== 'number') || ((config.weekStartsOn % 1) !== 0) 
                    || (config.weekStartsOn < 0) || (config.weekStartsOn > 6)) {
                throw 'The "config.weekStartsOn" param must be an int in the range 0-6.';
            }
        } else {
            config.weekStartsOn = 0;
        }
        if (config.hasOwnProperty('eventIndicatorStyle')) {
            if ((typeof config.eventIndicatorStyle !== 'string')
                    || ((config.eventIndicatorStyle !== 'bars') 
                    && (config.eventIndicatorStyle !== 'dots'))) {
                throw 'The "config.eventIndicatorStyle" param must be either "bars" or "dots".';
            }
        } else {
            config.eventIndicatorStyle = 'bars';
        }
        if (config.hasOwnProperty('eventColors')) {
            if (!Array.isArray(config.eventColors) || (config.eventColors.length === 0)) {
                throw 'The "config.eventColors" param must be a non-empty array';
            }
            for (var i = 0; i < config.eventColors.length; i++) {
                var color = config.eventColors[i];
                if (typeof color !== 'string' || !(/^#[0-9a-f]{6}$/.test(color))) {
                    throw 'Each color in "config.eventColor" must be in hex form (e.g. "#1234ab").';
                }
            }
        } else {
            config.eventColors = DEFAULT_COLORS;
        }
    };

    /**
     * Validate and parse the events passed to this calendar. Throws exceptions if input is
     * invalid.
     *
     * @param {array} events events to validate and parse.
     * @returns {EventList} representation of the input events as an EventList.
     */
    MultiMonthCalendar.prototype.parseEvents = function (events) {
        var result = new EventList(this.eventColors);
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            if (!Array.isArray(event)) {
                throw 'Event [' + i + ']: must be an array';
            }
            if (event.length !== 5) {
                throw 'Event [' + i + ']: event array must contain exactly 5 elements.';
            }
            var id = event[0];
            var title = event[1];
            var ranges = event[2];
            var hasHiddenDisplay = event[3];
            var dataForCallback = event[4];
            if (((typeof id !== 'string') || !id.trim()) && !(/^-?[0-9]+$/.test(id))) {
                throw 'Event [' + i + ']: id must be a non-empty string or int.';
            }
            if ((typeof title !== 'string') || !title.trim()) {
                throw 'Event [' + i + ']: title must be a non-empty string.';
            }
            if (!Array.isArray(ranges) || (ranges.length === 0)) {
                throw 'Event [' + i + ']: date range param must be a non-empty array.';
            }
            var mmcRanges = [];
            for (var j = 0; j < ranges.length; j++) {
                mmcRanges.push(this.parseRange(ranges[j]));
            }
            mmcRanges.sort(Range.compare);
            for (var j = 0; j < mmcRanges.length - 1; j++) {
                var range1 = mmcRanges[j];
                var range2 = mmcRanges[j+1];
                if (range1.isOverlapping(range2) || range1.isAdjacent(range2)) {
                    throw 'Event [' + i + ']: date ranges overlapping or adjacent.';
                }
            }
            result.add(new Event(id, title, mmcRanges, hasHiddenDisplay, dataForCallback));
        }
        this.validateHiddenEventsDontOverlap(result.getAllAsEvents());
        return result;
    };
    
    /**
     * Checks that events with hidden display don't overlap each other or any other events.
     * If a hidden event overlapped any other event, it wouldn't be possible to interact with
     * it in any way on an overlapping day: it doesn't have an indicator <div> to click on, and
     * because there's also another event on that day, we can't invoke the callback by just
     * clicking anywhere on the day.
     * 
     * @param {array} allEvents all the events added to the calendar.
     * @returns {void}
     */
    MultiMonthCalendar.prototype.validateHiddenEventsDontOverlap = function (allEvents) {
        for (var i = 0; i < allEvents.length; i++) {
            if (allEvents[i].hasHiddenDisplay) {
                var hiddenEvent = allEvents[i];
                for (var j = 0; j < allEvents.length; j++) {
                    var event = allEvents[j];
                    if ((hiddenEvent !== event) && hiddenEvent.isOverlapping(event)) {
                        throw 'Hidden events may not overlap any other events.';
                    }
                }
            }
        }
    };

    /**
     * Validate and parse a date range in the form (1) "string" or (2) "[string1, string2]" (quotes
     * excluded). Form (1) means a one-day range, and form (2) a multi-day range. "string",
     * "string1" & "string2" must be parsable to Javascript Dates.
     *
     * @param {string|array} range the range to validate and parse.
     * @returns {Range} a parsed range.
     */
    MultiMonthCalendar.prototype.parseRange = function (range) {
        if (typeof range === 'string') {
            this.validateDateString(range);
            var jsDate = new Date(range);
            var calDate = new CalDate(jsDate.getFullYear(), jsDate.getMonth() + 1,jsDate.getDate());
            return new Range(calDate, calDate);
        }
        if (Array.isArray(range)) {
            if (range.length !== 2) {
                throw 'An array passed as date range must have exactly two elements.';
            }
            this.validateDateString(range[0]);
            this.validateDateString(range[1]);
            var jsDateStart = new Date(range[0]);
            var jsDateEnd = new Date(range[1]);
            if (jsDateStart.getTime() > jsDateEnd.getTime()) {
                throw 'In range: [' + jsDateStart + ' - ' + jsDateEnd + '], end date is '
                + 'before the start date.';
            }
            var calDateStart = new CalDate(jsDateStart.getFullYear(), jsDateStart.getMonth() + 1,
                jsDateStart.getDate());
            var calDateEnd = new CalDate(jsDateEnd.getFullYear(), jsDateEnd.getMonth() + 1,
                jsDateEnd.getDate());
            return new Range(calDateStart, calDateEnd);
        }
        throw 'Range is not a string or an array: [' + range + '].';
    };

    /**
     * Checks whether the given string can be parsed to a JS Date, throwing an exception
     * if it can't.
     *
     * @param {string} string the string to validate.
     * @returns {void}
     */
    MultiMonthCalendar.prototype.validateDateString = function (string) {
        if ((new Date(string) === "Invalid Date") || isNaN(new Date(string))) {
            throw 'This is not a valid date specification: [' + string + '].';
        }
    };

    /**
     * Provides responsive capabilities whenever the window resizes.
     *
     * @param {MultiMonthCalendar} _this the MultiMonthCalendar. When the event handler fires,
     *     "this" is the window object.
     * @returns {void}
     */
    MultiMonthCalendar.prototype.resizeCallback = function(_this) {
        var containerWidth = document.getElementById(_this.containerId).clientWidth;
        // Whether the resize results in a container that's wider or more narrow.
        var isEnlarged = (_this.lastContainerWidth <= containerWidth);
        // When making the container larger, make sure breakpoints are checked in increasing order.
        // When making the container smaller - decreasing order.
        var i = (isEnlarged ? 0 : (_this.breakpoints.length - 1));
        while ((0 <= i) && (i < _this.breakpoints.length)) {
            var breakpoint = _this.breakpoints[i];
            var newCount = null;
            if ((_this.lastContainerWidth < breakpoint) && (containerWidth >= breakpoint)) {
                newCount = _this.numMonthsAroundBreakpoints[i + 1];
            }
            if ((_this.lastContainerWidth >= breakpoint) && (containerWidth < breakpoint)) {
                newCount = _this.numMonthsAroundBreakpoints[i];
            }
            if (newCount !== null) {
                // This is to cause the rerender to cut or add a month to the *left*
                // of the calendar, because at the beginning we're showing the last
                // (few) months and presumably the user is more interested in the
                // months closer to now. Example: we're showing May, June, July and
                // user makes the window smaller. We then want to show June, July,
                // NOT May, June.
                _this.start = _this.start.shift(_this.count - newCount);
                _this.count = newCount;
                _this.rerenderCalendar();
            }
            isEnlarged ? i++ : i--;
        }
        _this.lastContainerWidth = containerWidth;
    };

    /**
     * Render calendar HTML to page.
     *
     * @returns {void}
     */
    MultiMonthCalendar.prototype.renderCalendar = function () {
        var inner = document.createElement('div');

        // Back button.
        inner.appendChild(this.createNavButton(false));

        // Monthly calendars.
        var events = this.getEventsOverlappingCalendar();
        for (var i = 0; i < this.count; i++) {
            inner.appendChild(this.createMonthWrapper(this.start.shift(i), events));
        }

        // Forward button.
        inner.appendChild(this.createNavButton(true));

        var container = document.getElementById(this.containerId);
        container.classList.add('multimonth-calendar');
        container.appendChild(inner);
    };

    /**
     * Removes previously rendered calendar, and renders it anew.
     *
     * @returns {void}
     */
    MultiMonthCalendar.prototype.rerenderCalendar = function () {
        var container = document.getElementById(this.containerId);
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        this.renderCalendar();
    };

    /**
     * Creates a navigation (previous / next month(s)) button.
     *
     * @param {boolean} isForward whether the button points forward or backwards.
     * @returns {Element} the button element.
     */
    MultiMonthCalendar.prototype.createNavButton = function (isForward) {
        var div = MultiMonthCalendar.createNewElement('div', 'mmc-nav');
        var span = document.createElement('span');

        var _this = this;
        span.onclick = function() {
            var newStart = _this.start.shift((isForward ? 1 : (-1)) * _this.count);
            // Prevent going further back than backLimit.
            if (MonthYear.compare(_this.backLimit, newStart) > 0) {
                newStart = _this.backLimit;
            }
            // Prevent going further forward than forwardLimit.
            if (MonthYear.compare(_this.forwardLimit, newStart) < 0) {
                newStart = _this.forwardLimit;
            }
            _this.start = newStart;
            _this.rerenderCalendar();
        };
        span.innerHTML = (isForward ? '&#8250' : '&#8249') + ';';
        div.appendChild(span);
        return div;
    };

    /**
     * Create wrapper element for calendar month.
     *
     * @param {MonthYear} monthYear the month-year to render a calendar block for.
     * @param {EventList} eventList the list of events to render in the entire calendar being drawn,
     *     not only in the current block.
     * @return {Element} the calendar block for a single month.
     */
    MultiMonthCalendar.prototype.createMonthWrapper = function (monthYear, eventList) {
        var div = MultiMonthCalendar.createNewElement("div", "mmc-month");
        div.appendChild(this.createMonthNameWrap(monthYear));
        div.appendChild(this.createMonthTableWrap(monthYear, eventList));
        return div;
    };

    /**
     * Create an HTML element with month name and year.
     *
     * @param {MonthYear} monthYear the month-year to render the name for.
     * @return {Element} a div containing the month-year name.
     */
    MultiMonthCalendar.prototype.createMonthNameWrap = function (monthYear) {
        var div = MultiMonthCalendar.createNewElement("div", "month-name");
        var span = document.createElement("span");
        span.innerHTML = this.getMonthName(monthYear.month) + " " + monthYear.year;
        div.appendChild(span);
        return div;
    };

    /**
     * Get the name of a month.
     *
     * @param {Number} monthNumber the number of the month (0 - 11).
     * @return {string} the name of the month.
     */
    MultiMonthCalendar.prototype.getMonthName = function (monthNumber) {
        for (var i = 0; i < this.monthNames.length; i++) {
            if (i === monthNumber) {
                return this.monthNames[i];
            }
        }
    };

    /**
     * Create an HTML table representing days of a single month.
     *
     * @param {MonthYear} monthYear the month-year to render the table for.
     * @param {EventList} eventList the list of events to render in the entire calendar being drawn,
     *     not only in the current block.
     * @return {Element} a calendar table with days for a single month.
     */
    MultiMonthCalendar.prototype.createMonthTableWrap = function (monthYear, eventList) {
        var table = document.createElement("table");
        table.appendChild(this.createMonthTableHead());
        table.appendChild(this.createMonthTableBody(monthYear, eventList));
        return table;
    };

    /**
     * Create an HTML thead element.
     *
     * @return {Element} a calendar thead element.
     */
    MultiMonthCalendar.prototype.createMonthTableHead = function () {
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");

        for (var i = this.weekStartsOn; i < this.weekStartsOn + 7; i++) {
            tr.innerHTML += "<th>" + this.daysShort[i % 7] + "</th>";
        }

        thead.appendChild(tr);
        return thead;
    };

    /**
     * Create the HTML tbody element for a calendar table for a single month.
     *
     * @param {MonthYear} monthYear the month-year to render the table for.
     * @param {EventList} eventList the list of events to render in the entire calendar being drawn,
     *     not only in the current block.
     * @return {Element} a calendar table with days for a single month.
     */
    MultiMonthCalendar.prototype.createMonthTableBody = function (monthYear, eventList) {
        var tbody = document.createElement("tbody");
        this.distributeDays(monthYear, tbody, eventList);
        return tbody;
    };

    /**
     * Create the cells of the HTML table representing days of a single month.
     *
     * @param {MonthYear} monthYear the month-year to render the table for.
     * @param {Element} tbody the tbody HTML element to attach the cells to.
     * @param {EventList} eventList the list of events to render in the entire calendar being drawn,
     *     not only in the current month block. By "entire calendar" we mean what's going to be
     *     displayed on the screen now (e.g. 3 months), NOT the theoretical full calendar 
     *     between back limit and forward limit.
     * @return {Element} a calendar table with days for a single month.
     */
    MultiMonthCalendar.prototype.distributeDays = function (monthYear, tbody, eventList) {
        var day = 1;
        var dayCount = monthYear.getNumDays();
        var maxEventIndex = eventList.getMaxIndex();

        while (day < dayCount) {
            var weekRow = document.createElement("tr");
            for (var i = this.weekStartsOn; i < this.weekStartsOn + 7; i++) {
                if (monthYear.getWeekDay(day) === (i % 7)) {
                    // Create <td> for the day.
                    var td = document.createElement("td");
                    td.classList.add('mmc-calendar-day');
                    // Perhaps indicate weekend.
                    var isWeekend = (((i % 7) === 0) || ((i % 7) === 6));
                    if (isWeekend) {
                        td.classList.add('weekend');
                    }
                    // Get events on the day.
                    var date = new CalDate(monthYear.year, monthYear.month + 1, day);
                    var eventsOnDay = eventList.getSublistOverlapping(new Range(date, date), false);
                    // Add CSS if events present.
                    var hasOneEvent = (eventsOnDay.length() === 1);
                    if (hasOneEvent) {
                        td.classList.add('has-event');
                        td.classList.add('one-event');
                    }
                    var hasManyEvents = (eventsOnDay.length() > 1);
                    if (hasManyEvents) {
                        td.classList.add('has-event');
                    }
                    // If only one event, click on entire <td> triggers callback for that event,
                    // and hovering over it shows tooltip.
                    if (hasOneEvent) {
                        var event = eventsOnDay.get(0).event;
                        td.onclick = this.createOnclickHandler(event.dataForCallback);
                        td.title = event.title;
                    }
                    // Day number.
                    var dayNumDiv = document.createElement('div');
                    dayNumDiv.innerHTML = day;
                    td.appendChild(dayNumDiv);
                    // Either add placeholder (giving the <td> some height), or event indicators.
                    if (maxEventIndex === null) {
                        var placeholder = document.createElement('div');
                        placeholder.classList.add('calendar-day-placeholder');
                        placeholder.classList.add(this.eventIndicatorStyle);
                        td.appendChild(placeholder);
                    } else {
                        for (var j = maxEventIndex; j >= 0; j--) {
                            td.appendChild(this.createEventIndicator(eventsOnDay, j));
                        }
                    }
                    weekRow.appendChild(td);
                    day++;
                } else {
                    var td = document.createElement('td');
                    td.classList.add('mmc-calendar-day');
                    td.classList.add('other-month');
                    weekRow.appendChild(td);
                }
                if (day > dayCount) {
                    break;
                }
            }
            
            MultiMonthCalendar.shrinkDayCells(weekRow, maxEventIndex);
            tbody.appendChild(weekRow);
        }
    };
    
    /**
     * In a single calendar week, removes space in each <td> cell corresponding to a day in that
     * week, if there's no event to show in that space across all the days of that week.
     * 
     * For example, if in a given week space is reserved in all <td> cells for 4 events, but only
     * 1 actually occurs in the week, 3 rows of space (for the other 3 events) could be removed.
     * 
     * The purpose of all this is so that the calendar is not bloated vertically if it has e.g.
     * only one day with e.g. 7 events.
     * 
     * @param {object} weekRow HTML <tr> element holding <td> cells for days of a single week.
     * @param {Number|null} maxEventIndex the maximum index an event could be at in this week 
     *     (counting 0, 1, 2, 3, 4, ..) or null if there could be no events.
     * @returns {void}
     */
    MultiMonthCalendar.shrinkDayCells = function (weekRow, maxEventIndex) {
        if (maxEventIndex === null) {
            return;
        }

        // Note: in the loop rowIdx goes from maxEventIndex **+ 1** because first child of each 
        // dayTd is the <div> containing the day number, and <div>'s for events only start after it.
        var tdRows = null;
        // For each row above the first (first contains the day number) ..
        for (var rowIdx = maxEventIndex + 1; rowIdx > 0; rowIdx--) {
            var canRemoveRow = true;
            // .. go through all the days of the week ..
            for (var dayIdx = 0; dayIdx <  7; dayIdx++) {
                var dayTd = weekRow.childNodes[dayIdx];
                // .. check if the day <td> cell exists (opposite could happen for days at the
                // end of table, after end of month), is not empty inside (opposite could happen
                // for days at the beginning of table, before start of month) ..
                if (dayTd && (tdRows = dayTd.childNodes) && (tdRows.length > 0)) {
                    // .. check if either the day <td> cell is too short to be truncated, or
                    // in the row we're now considering it has an event ..
                    if ((tdRows.length <= 2) || tdRows[rowIdx].classList.contains('event')) {
                        // .. if so, prevent the row from being cut out.
                        canRemoveRow = false;
                        break;
                    }
                }
            }
            if (canRemoveRow) {
                // If the row can be cut out go through all the days of the week ..
                for (var dayIdx = 0; dayIdx <  7; dayIdx++) {
                    var dayTd = weekRow.childNodes[dayIdx];
                    // .. skip the cells corresponding to days before or after the month ..
                    if (dayTd && (tdRows = dayTd.childNodes) && (tdRows.length > 0)) {
                        // .. and cut out the child <div> in the current row.
                        dayTd.removeChild(tdRows[rowIdx]);
                    }
                }
            }
        }        
    };
    
    /**
     * Creates a horizontal bar (an HTML div) in a single table cell, representing one of the events
     * occurring on the day of that cell.
     *
     * @param {EventList} eventsOnDay all the events happening on this day.
     * @param {Number} indicatorIndex which position does this indicator have in relation to other
     *     indicators for this day. They go from 0 to n. Smaller indexes will render the indicator
     *     closer to top.
     * @returns {Element} an HTML element representing an event (or lack thereof) happening
     *     on a single day.
     */
    MultiMonthCalendar.prototype.createEventIndicator = function (eventsOnDay, indicatorIndex) {
        var eventIndicator = document.createElement('div');
        eventIndicator.classList.add('calendar-day-indicator');
        eventIndicator.classList.add(this.eventIndicatorStyle);
        // Find event (if any) that matches this indicator's index.
        for (var i = 0; i < eventsOnDay.length(); i++) {
            var eventViewModel = eventsOnDay.get(i);
            if (indicatorIndex === eventViewModel.index) { // Event found.
                var event = eventViewModel.event;
                if (event.hasHiddenDisplay) {
                    eventIndicator.classList.add('hidden');
                }
                eventIndicator.classList.add('event');
                eventIndicator.title = event.title;
                eventIndicator.style.backgroundColor = eventViewModel.color;
                // If > 1 event on day, add click handlers to each indicator, not to entire <td>
                if (eventsOnDay.length() > 1) {
                    eventIndicator.onclick = this.createOnclickHandler(event.dataForCallback);
                }
            }
        }
        return eventIndicator;
    };
    
    /**
     * Creates a closure handler to be invoked when the user clicks on an event. Separate function
     * like this is needed to create scope for the dataForCallback param, not to be overwritten by
     * loop execution. See https://stackoverflow.com/questions/750486
     *
     * @param {mixed} dataForCallback the data that will be passed to the callback on click.
     * @return {function} a closure invoking the callback passed to the calendar constructor.
     */
    MultiMonthCalendar.prototype.createOnclickHandler = function (dataForCallback) {
        var _this = this;
        return function() {
            _this.callback(dataForCallback);
        };
    };

    /**
     * Returns an EventList representing the subset of all events passed to this calendar. The
     * subset will be displayed to the user if the calendar is drawn according to its current
     * params such as year, month, and count.
     *
     * @returns {EventList} the events to be drawn with the current calendar params.
     */
    MultiMonthCalendar.prototype.getEventsOverlappingCalendar = function () {
        var startOfCalendar = new CalDate(this.start.year, this.start.month + 1, 1);
        var endOfCalendar = this.getCalendarEndDate();
        return this.eventList.getSublistOverlapping(new Range(startOfCalendar, endOfCalendar),true);
    };

    /**
     * Return the date ending the calendar currently drawn / being drawn.
     *
     * @returns {Date} the date ending the calendar currently drawn / being drawn.
     */
    MultiMonthCalendar.prototype.getCalendarEndDate = function () {
        var lastMonth = this.start.shift(this.count);
        return new CalDate(lastMonth.year, lastMonth.month + 1, lastMonth.getNumDays());
    };

    /**
     * Create new HTML element with a given CSS class.
     *
     * @param {string} element element tag name.
     * @param {string} className element class name.
     * @return {Element} a created HTML element.
     */
    MultiMonthCalendar.createNewElement = function (element, className) {
        var result = document.createElement(element);
        result.classList.add(className);
        return result;
    };



    /*
     * CalDate class.
     */

    // TODO: Move entire file to use CalDates.



    /**
     * A date class with more intuitive month numbering (1-12) than standard JS Date.
     *
     * @param {Number} year the year.
     * @param {Number} month the month (1-12).
     * @param {Number} day the day of the month (1-31).
     * @returns {CalDate}
     */
    var CalDate = function (year, month, day) {
        this.date = new Date(year, month - 1, day);
    };

    /**
     * Returns a JS Date representation of this CalDate.
     * @returns {Date} a JS Date representation.
     */
    CalDate.prototype.toJSDate = function () {
        return new Date(this.date.getTime());
    };



    /*
     * Range class.
     */



    /**
     * A continuous range of days.
     *
     * @param {CalDate} start the beginning date of the Range (inclusive).
     * @param {CalDate} end the end date of the Range (inclusive).
     * @returns {Range}
     */
    var Range = function (start, end) {
        this.start = start.date;
        this.end = end.date;
    };

    /**
     * Return a Range being the intersection of this Range and the argument.
     *
     * @param {Range} range the Range to intersect this one with.
     * @returns {Range} the Range being the intersection, or null if they are disjoint.
     */
    Range.prototype.intersect = function (range) {
        if (!this.isOverlapping(range)) {
            return null;
        }

        var start = ((this.start < range.start) ? range.start : this.start);
        var end = ((this.end < range.end) ? this.end : range.end);
        return Range.fromDates(start, end);
    };

    /**
     * Returns whether this Range and the argument Range overlap.
     *
     * @param {Range} range the Range to check overlapping with.
     * @returns {Boolean} whether this Range and the argument Range overlap.
     */
    Range.prototype.isOverlapping = function (range) {
        return ((range.start <= this.end) && (range.end >= this.start));
    };

    /**
     * Returns whether this Range and the argument Range are next to each other (without at least
     * one day not falling in either of the two between them).
     *
     * @param {Range} range the Range to check adjacency.
     * @returns {Boolean} whether this Range and the argument Range are adjacent.
     */
    Range.prototype.isAdjacent = function (range) {
        var end1PlusOneDay = new Date(this.end.getTime());
        end1PlusOneDay.setDate(end1PlusOneDay.getDate() + 1);
        if (end1PlusOneDay.getTime() === range.start.getTime()) {
            return true;
        }

        var end2PlusOneDay = new Date(range.end.getTime());
        end2PlusOneDay.setDate(end2PlusOneDay.getDate() + 1);
        if (end2PlusOneDay.getTime() === this.start.getTime()) {
            return true;
        }
        return false;
    };

    /**
     * Helper for creating Ranges from JS Dates.
     *
     * @param {Date} start a JS Date.
     * @param {Date} end a JS Date.
     * @returns {Range}
     */
    Range.fromDates = function (start, end) {
        var calDateStart = new CalDate(start.getFullYear(), start.getMonth() + 1, start.getDate());
        var calDateEnd = new CalDate(end.getFullYear(), end.getMonth() + 1, end.getDate());
        return new Range(calDateStart, calDateEnd);
    };

    /**
     * Comparator of Range, based on: first, start dates, and then, end dates.
     *
     * @param {Range} r1 the first range to compare.
     * @param {Range} r2 the second range to compare.
     * @returns {Number} -1, 0, 1 according to standard comparator contract.
     */
    Range.compare = function (r1, r2) {
        if (r1.start < r2.start) {
            return -1;
        }
        if (r1.start > r2.start) {
            return 1;
        }
        if (r1.end < r2.end) {
            return -1;
        }
        if (r1.end > r2.end) {
            return 1;
        }
        return 0;
    };



    /*
     * MonthYear class.
     */



    /**
     * Helper class storing a (month, year) pair.
     *
     * @param {Number} month number of the month in range of 0-11.
     * @param {Number} year the year.
     * @returns {MonthYear} this class instance.
     */
    var MonthYear = function (month, year) {
        this.month = month;
        this.year = year;
    };

    /**
     * Return a new instance of MonthYear, shifted by a certain number of months.
     *
     * @param {Number} numMonths number of months to shift. May be negative.
     * @returns {MonthYear} a new, updated MonthYear instance. Old instance is unchanged.
     */
    MonthYear.prototype.shift = function (numMonths) {
        var tempMonth = this.month + numMonths;
        var year = this.year;
        if (tempMonth < 0) {
            year--;
        }
        if (tempMonth > 11) {
            year++;
        }
        return new MonthYear((tempMonth + 12) % 12, year);
    };

    /**
     * Returns the number of days in the month represented by this instance (28-31).
     *
     * @returns {Number} the number of days in this month.
     */
    MonthYear.prototype.getNumDays = function () {
        return new Date(this.year, this.month + 1, 0).getDate();
    };

    /**
     * Returns week day number (0-6) for every day in the month (0-30).
     *
     * @param {Number} dayOfMonth the day of month to find which weekday it is.
     * @returns {Number} a number between 0-6 representing Sunday-Saturday.
     */
    MonthYear.prototype.getWeekDay = function (dayOfMonth) {
        return new Date(this.year, this.month, dayOfMonth).getDay();
    };
    
    /**
     * Natural comparator of MonthYear's.
     *
     * @param {MonthYear} my1 the first MonthYear to compare.
     * @param {MonthYear} my2 the second MonthYear to compare.
     * @returns {Number} -1, 0, 1 according to standard comparator contract.
     */
    MonthYear.compare = function (my1, my2) {
        if (my1.year < my2.year) {
            return -1;
        }
        if (my1.year > my2.year) {
            return 1;
        }
        if (my1.month < my2.month) {
            return -1;
        }
        if (my1.month > my2.month) {
            return 1;
        }
        return 0;
    };



    /*
     * EventList class.
     */



    /**
     * A list of EventViewModels.
     *
     * @param {array} colors the colors to use when rendering event indicators.
     * @returns {EventList} a list of EventViewModels.
     */
    var EventList = function (colors = DEFAULT_COLORS) {
        this.list = [];
        this.colors = colors;
    };

    /**
     * Pushes an Event to the list. index and color params are optional.
     *
     * @param {Event} event the event to add to the list.
     * @param {Number} index the index used when drawing the event in case of event overlap. See
     *     the method assignIndexAndColor() for an illustrative example.
     * @param {string} color the CSS color used when drawing the event.
     * @returns {void}
     */
    EventList.prototype.add = function (event, index, color) {
        // TODO: Ensure uniqueness of event ids.
        if (typeof index === 'undefined') {
            index = 0;
        }
        if (typeof color === 'undefined') {
            color = '#ffffff';
        }
        this.list.push(new EventViewModel(event, index, color));
    };

    /**
     * Returns the EventViewModel from this list with the given position.
     *
     * @param {Number} i the position on the list.
     * @returns {EventViewModel} the event obtained from the list.
     */
    EventList.prototype.get = function (i) {
        return this.list[i];
    };

    /**
     * Returns the number of events on the list.
     *
     * @returns {Number} the length of this list.
     */
    EventList.prototype.length = function () {
        return this.list.length;
    };

    /**
     * Returns a new EventList (the current one is not modified), containing the events which
     * at least partially overlap with the range specified by the start and end params.
     *
     * @param {Range} range the time range to find sublist for.
     * @param {boolean} shouldReindex whether to sort the new list, and then generate new
     *     indexes and colors for events on it.
     * @returns {EventList} a subset list, with events falling in the passed in range.
     */
    EventList.prototype.getSublistOverlapping = function (range, shouldReindex) {
        var result = new EventList(this.colors);
        for (var i = 0; i < this.list.length; i++) {
            var event = this.list[i].event;
            var rangesOverlapping = [];
            for (var j = 0; j < event.parts.length; j++) {
                var part = event.parts[j];
                if (part.range.isOverlapping(range)) {
                    rangesOverlapping.push(part.range.intersect(range));
                }
            }
            if (rangesOverlapping.length > 0) {
                var newEvent = new Event(event.id, event.title, rangesOverlapping, 
                        event.hasHiddenDisplay, event.dataForCallback);
                result.add(newEvent, this.list[i].index, this.list[i].color);
            }
        }
        if (shouldReindex) {
            result.assignIndexAndColor();
        }
        return result;
    };

    /**
     * Sorts this list according, first, to start dates of events, second, end dates of events,
     * third, titles of events.
     *
     * @returns {void}
     */
    EventList.prototype.sort = function () {
        this.list.sort(function (eventModel1, eventModel2) {
            var start1 = eventModel1.event.parts[0].start;
            var start2 = eventModel2.event.parts[0].start;
            if (start1 > start2) {
                return 1;
            }
            if (start1 < start2) {
                return -1;
            }
            var end1 = eventModel1.event.parts[eventModel1.event.parts.length - 1].end;
            var end2 = eventModel2.event.parts[eventModel2.event.parts.length - 1].end;
            if (end1 > end2) {
                return 1;
            }
            if (end1 < end2) {
                return -1;
            }
            return eventModel1.event.title.localeCompare(eventModel2.event.title);
        });
    };

    /**
     * Sorts this list, and then assigns indexes and colors to events on it. The assignment happens
     * in such a way that overlapping events get different indexes. E.g. if there's three events,
     * one from May 5 - May 15, second May 10 - May 25, third May 20 - May 30, then first and third
     * will likely get index 0, and second index 1.
     *
     * Colors are assigned in a cyclic way from a predefined list of colors.
     *
     * @returns {void}
     */
    EventList.prototype.assignIndexAndColor = function () {
        this.sort();

        for (var i = 0; i < this.list.length; i++) {
            var event = this.list[i].event;
            var takenIndexes = [];
            var j = i - 1;
            while (j >= 0) {
                var event2 = this.list[j].event;
                if (event.isOverlapping(event2)) {
                    takenIndexes.push(this.list[j].index);
                }
                j--;
            }
            var minUntakenIdx = 0;
            while (true) {
                if (takenIndexes.indexOf(minUntakenIdx) === -1) {
                    break;
                }
                minUntakenIdx++;
            }
            this.list[i].index = minUntakenIdx;
            this.list[i].color = this.colors[i % this.colors.length];
        }
    };

    /**
     * Returns the maximum event index used by this list (this is NOT the list length), or null
     * if list is empty.
     *
     * @returns {Number|null} the maximum index used by this list or null if list is empty.
     */
    EventList.prototype.getMaxIndex = function () {
        if (this.list.length === 0) {
            return null;
        }
        var max = 0;
        for (var i = 0 ; i < this.list.length; i++) {
            if (this.list[i].index > max) {
                max = this.list[i].index;
            }
        }
        return max;
    };

    /**
     * Returns the EventViewModel held by this list that has the given id.
     *
     * @param {string} id the id to search by.
     * @returns {EventViewModel|null} the EventViewModel found, or null if not found.
     */
    EventList.prototype.findEventModelById = function (id) {
        for (var i = 0; i < this.list.length; i++) {
            var eventModel = this.list[i];
            if (eventModel.event.id === id) {
                return eventModel;
            }
        }
        return null;
    };
    
    /**
     * Return the events held in the form of EventViewModel's.
     * 
     * @returns {array}
     */
    EventList.prototype.getAllAsEventViewModels = function () {
        return this.list;
    };
    
    /**
     * Return the events held in the form of Event's.
     * 
     * @returns {Array}
     */
    EventList.prototype.getAllAsEvents = function () {
        var allEvents = [];
        for (var i = 0; i < this.list.length; i++) {
            allEvents.push(this.list[i].event);
        }
        return allEvents;
    };



    /*
     * Event class.
     */



    /**
     * Container for event id, title, and time ranges that it runs over.
     *
     * @param {string} id the id of the title.
     * @param {string} title the event title.
     * @param {array} ranges the time ranges that this event runs over.
     * @param {boolean} hasHiddenDisplay whether the event should be displayed in a hidden way.
     * @param {mixed} dataForCallback any kind of data that the callback invoked when clicking
     *     on the event may need.
     * @returns {Event} a container for the above.
     */
    var Event = function (id, title, ranges, hasHiddenDisplay, dataForCallback) {
        // TODO: Can we remove id as a param (and perhaps only use one internally) now that 
        // there's a separate dataForCallback param?
        this.id = id;
        this.title = title;
        this.parts = [];
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            this.parts.push(new EventPart(id, range));
        }
        this.parts.sort(EventPart.compare);
        this.hasHiddenDisplay = hasHiddenDisplay;
        this.dataForCallback = dataForCallback;
    };

    /**
     * Returns whether this Event overlaps with another.
     *
     * @param {Event} event another event, to check overlapping with.
     * @returns {Boolean} whether the two events overlap.
     */
    Event.prototype.isOverlapping = function (event) {
        var allRanges = [];
        for (var i = 0; i < this.parts.length; i++) {
            allRanges.push(this.parts[i].range);
        }
        for (var i = 0; i < event.parts.length; i++) {
            allRanges.push(event.parts[i].range);
        }
        allRanges.sort(Range.compare);
        for (var i = 0; i < allRanges.length - 1; i++) {
            var range1 = allRanges[i];
            var range2 = allRanges[i+1];
            if (range1.isOverlapping(range2)) {
                return true;
            }
        }
        return false;
    };



    /*
     * EventPart class.
     */



    /**
     * Continuous part of an Event (which may consist of several non-contiguous parts).
     *
     * @param {string} id the id of the Event.
     * @param {Range} range the time span of this part.
     * @returns {EventPart}
     */
    var EventPart = function (id, range) {
        this.id = id;
        this.range = range;
        this.start = range.start;
        this.end = range.end;
    };

    /**
     * Returns whether this EventPart and the argument EventPart overlap.
     *
     * @param {EventPart} eventPart the EventPart to check overlapping with.
     * @returns {Boolean} whether this EventPart and the argument EventPart overlap.
     */
    EventPart.prototype.isOverlapping = function (eventPart) {
        return ((eventPart.start <= this.end) && (eventPart.end >= this.start));
    };

    /**
     * Comparator of EventPart, based on: first, start dates, and then, end dates.
     *
     * @param {EventPart} part1 the first part to compare.
     * @param {EventPart} part2 the second part to compare.
     * @returns {Number} -1, 0, 1 according to standard comparator contract.
     */
    EventPart.compare = function (part1, part2) {
        if (part1.start < part2.start) {
            return -1;
        }
        if (part1.start > part2.start) {
            return 1;
        }
        if (part1.end < part2.end) {
            return -1;
        }
        if (part1.end > part2.end) {
            return 1;
        }
        return 0;
    };



    /*
     * EventViewModel class.
     */



    /**
     * Container for an Event, which index it should receive when drawn with other overlapping
     * events, and which color to use for it.
     *
     * @param {Event} event the event to store.
     * @param {Number} index the index to use when drawing this event. E.g. if two events happen on
     *     same day, and one has index 0, and the other 2, then the one with index 0 will be drawn
     *     as a horizontal bar on top, then there will be a gap (corresponding to unused index 1),
     *     and then another horizontal bar for the event with index 2.
     * @param {string} color CSS color spec, e.g. 'red', or '#ffffff'.
     * @returns {EventViewModel} a container for the above.
     */
    var EventViewModel = function (event, index, color) {
        this.event = event;
        this.index = index;
        this.color = color;
    };



    /*
     * Exposing constructors of inner classes (some of them only for testing purposes).
     */



    MultiMonthCalendar.monthYear = function (month, year) {
        return new MonthYear(month, year);
    };

    MultiMonthCalendar.eventList = function () {
        return new EventList();
    };

    MultiMonthCalendar.event = function (id, title, ranges, hasHiddenDisplay, dataForCallback) {
        return new Event(id, title, ranges, hasHiddenDisplay, dataForCallback);
    };

    MultiMonthCalendar.range = function (start, end) {
        return new Range(start, end);
    };

    MultiMonthCalendar.date = function (year, month, day) {
        return new CalDate(year, month, day);
    };
    


    window.MultiMonthCalendar = MultiMonthCalendar;

})();
