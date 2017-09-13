'use strict';

(function() {

    /**
     * Calendar able to:
     * - draw multiple monthly displays
     * - responsively increase / decrease the number of months shown
     * - display events happening during the shown months, handling event overlap
     * - move forward / back to previous / following months
     * - run a callback when user clicks on a given event
     *
     * @param {string} containerId the HTML
     * @param {Number} month the month to display right off, in range 0-11.
     * @param {Number} year the year to display right off.
     * @param {array} events an array of events, each being an array containing: title (string),
     *     start (Date), end (Date).
     * @param {function} eventClickCallback a function executed when user clicks on the display of
     *     an event.
     * @returns {MultiMonthCalendar} an instance of the calendar.
     */
    var MultiMonthCalendar = function (containerId, month, year, events, eventClickCallback) {
        this.containerId = containerId;
        this.start = new MonthYear(month, year);
        this.count = 1;
        this.daysShort = ["N", "P", "W", "Ś", "C", "P", "S"];
        this.monthNames = [
            "styczeń",
            "luty",
            "marzec",
            "kwiecień",
            "maj",
            "czerwiec",
            "lipiec",
            "sierpień",
            "wrzesień",
            "październik",
            "listopad",
            "grudzień"
        ];
        this.eventList = new EventList();
        for (var i = 0; i < events.length; i++) {
            this.eventList.add(new Event(events[i][0], events[i][1], events[i][2], events[i][3]));
        }
        this.eventList.sort();
        this.callback = eventClickCallback;
        // Breakpoints around which number of months shown can change. Must be increasing.
        this.breakpoints = [600, 800, 1000, 1200];
        // Number of these should be number of breakpoints + 1. The first number
        // is used when window width is below 1st breakpoint; the second number
        // is used when window width is b/n 1st and 2nd breakpoint, etc. Must be increasing.
        this.numMonthsAroundBreakpoints = [1, 2, 3, 4, 5];
        this.lastWindowWidth = 0; // Initial resizeCallback call below will set it.

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
     * Provides responsive capabilities whenever the window resizes.
     *
     * @param {MultiMonthCalendar} _this the MultiMonthCalendar. When the event handler fires,
     *     "this" is the window object.
     * @returns {void}
     */
    MultiMonthCalendar.prototype.resizeCallback = function(_this) {
        var windowWidth = _this.getWindowWidth();
        // Whether the resize results in a screen that's wider or more narrow.
        var isEnlarged = (_this.lastWindowWidth <= windowWidth);
        // When making the window larger, make sure breakpoints are checked in increasing order.
        // When making the windows smaller - decreasing order.
        var i = (isEnlarged ? 0 : (_this.breakpoints.length - 1));
        while ((0 <= i) && (i < _this.breakpoints.length)) {
            var breakpoint = _this.breakpoints[i];
            var newCount = null;
            if ((_this.lastWindowWidth < breakpoint) && (windowWidth >= breakpoint)) {
                newCount = _this.numMonthsAroundBreakpoints[i + 1];
            }
            if ((_this.lastWindowWidth >= breakpoint) && (windowWidth < breakpoint)) {
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
        _this.lastWindowWidth = windowWidth;
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
        inner.appendChild(this.createMonthSpacer());

        // Monthly calendars.
        var events = this.getEventsOverlappingCalendar();
        for (var i = 0; i < this.count; i++) {
            inner.appendChild(this.createMonthWrapper(this.start.shift(i), events));
            if (i < this.count - 1) {
                inner.appendChild(this.createMonthSpacer());
            }
        }

        // Forward button.
        inner.appendChild(this.createMonthSpacer());
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
        var div = this.createNewElement('div', 'mmc-nav');
        var span = document.createElement('span');

        var _this = this;
        span.onclick = function() {
            _this.start = _this.start.shift((isForward ? 1 : (-1)) * _this.count);
            _this.rerenderCalendar();
        };
        span.innerHTML = (isForward ? '&#8250' : '&#8249') + ';';
        div.appendChild(span);
        return div;
    };

    /**
     * Create a spacer div separating neighboring monthly calendars.
     *
     * @returns {Element} the spacer div element.
     */
    MultiMonthCalendar.prototype.createMonthSpacer = function () {
        var div = this.createNewElement("div", "mmc-month-spacer");
        div.innerHTML = "&nbsp;";
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
        var div = this.createNewElement("div", "mmc-month");
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
        var div = this.createNewElement("div", "month-name");
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

        for (var i = 0; i < this.daysShort.length; i++) {
            tr.innerHTML += "<th>" + this.daysShort[i] + "</th>";
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
     *     not only in the current block.
     * @return {Element} a calendar table with days for a single month.
     */
    MultiMonthCalendar.prototype.distributeDays = function (monthYear, tbody, eventList) {
        var _this = this;
        var day = 1;
        var dayCount = monthYear.getNumDays();
        var maxEventIndex = eventList.getMaxIndex();

        while (day < dayCount) {
            var weekRow = document.createElement("tr");
            for (var i = 0; i < 7; i++) {
                if (monthYear.getWeekDay(day) === i) {
                    var td = document.createElement("td");
                    td.classList.add('mmc-calendar-day');
                    var isWeekend = ((i === 0) || (i === 6));
                    if (isWeekend) {
                        td.classList.add('weekend');
                    }
                    var date = new CalDate(monthYear.year, monthYear.month + 1, day);
                    var eventsOnDay = eventList.getSublistOverlapping(new Range(date, date), false);
                    var hasOneEvent = (eventsOnDay.length() === 1);
                    if (hasOneEvent) {
                        td.classList.add('one-event');
                    }
                    var hasManyEvents = (eventsOnDay.length() > 1);
                    if (hasManyEvents) {
                        td.classList.add('many-events');
                    }
                    if (hasOneEvent) {
                        td.onclick = this.createOnclickHandler(eventsOnDay.get(0).event.id);
                    }
                    var dayNumDiv = document.createElement('div');
                    dayNumDiv.innerHTML = day;
                    td.appendChild(dayNumDiv);
                    for (var j = maxEventIndex; j >= 0; j--) {
                        td.appendChild(this.createNewElement('div', 'calendar-day-spacer'));
                        td.appendChild(this.createEventIndicator(eventsOnDay, j));
                    }
                    weekRow.appendChild(td);
                    day++;
                } else {
                    weekRow.innerHTML += "<td class='mmc-calendar-day other-month'></td>";
                }
                if (day > dayCount) {
                    break;
                }
            }
            tbody.appendChild(weekRow);
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
        // Find event (if any) that matches this indicator's index.
        for (var i = 0; i < eventsOnDay.length(); i++) {
            var eventViewModel = eventsOnDay.get(i);
            if (indicatorIndex === eventViewModel.index) { // Event found.
                eventIndicator.classList.add('event');
                eventIndicator.title = eventViewModel.event.title;
                eventIndicator.style.backgroundColor = eventViewModel.color;
                // If > 1 event on day, add click handlers to each indicator, not to entire <td>
                if (eventsOnDay.length() > 1) {
                    eventIndicator.onclick = this.createOnclickHandler(eventViewModel.event.id);
                }
            }
        }
        return eventIndicator;
    };

    /**
     * Creates a closure handler to be invoked when the user clicks on an event. Separate function
     * like this is needed to create scope for the id param, not to be overwritten by loop
     * execution. See https://stackoverflow.com/questions/750486
     *
     * @param {string} id the id of the event, to be passed to the callback function.
     * @return {function} a closure invoking the callback passed to the calendar constructor.
     */
    MultiMonthCalendar.prototype.createOnclickHandler = function (id) {
        var _this = this;
        return function() {
            _this.callback(id);
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
     * Gets the current window width. Used for responsiveness. Code adapted from jQuery.
     *
     * @returns {Number} the current window width.
     */
    MultiMonthCalendar.prototype.getWindowWidth = function () {
        var doc = window.document;
        var docwindowProp = doc.documentElement["clientWidth"];
        return ((doc.compatMode === "CSS1Compat") && docwindowProp)
            || (doc.body && doc.body["clientWidth"])
            || docwindowProp;
    };

    /**
     * Create new HTML element with a given CSS class.
     *
     * @param {string} element element tag name.
     * @param {string} className element class name.
     * @return {Element} a created HTML element.
     */
    MultiMonthCalendar.prototype.createNewElement = function (element, className) {
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
     * @param {type} end the end date of the Range (inclusive).
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



    /*
     * EventList class.
     */



    /**
     * A list of EventViewModels.
     *
     * @returns {EventList} a list of EventViewModels.
     */
    var EventList = function () {
        this.list = [];
        // Taken from Sejmometr logo.
        this.COLORS = ['#62bb46', '#0099da', '#fdb924', '#e23d40', '#993f98',
            '#4a9536', '#f79433', '#b55594'];
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
        var result = new EventList();
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
                var newEvent = new Event(event.id, event.title, rangesOverlapping);
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
            this.list[i].color = this.COLORS[i % this.COLORS.length];
        }
    };

    /**
     * Returns the maximum event index used by this list (this is NOT the list length).
     *
     * @returns {Number} the maximum index used by this list.
     */
    EventList.prototype.getMaxIndex = function () {
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



    /*
     * Event class.
     */



    /**
     * Container for event id, title, and time ranges that it runs over.
     *
     * @param {string} id the id of the title.
     * @param {string} title the event title.
     * @param {array} ranges the time ranges that this event runs over.
     * @returns {Event} a container for the above.
     */
    var Event = function (id, title, ranges) {
        this.id = id;
        this.title = title;
        this.parts = [];
        for (var i = 0; i < ranges.length; i++) {
            var range = ranges[i];
            this.parts.push(new EventPart(id, range));
        }
        this.parts.sort(EventPart.compare);
    };

    /**
     * Returns whether this Event overlaps with another.
     *
     * @param {Event} event another event, to check overlapping with.
     * @returns {Boolean} whether the two events overlap.
     */
    Event.prototype.isOverlapping = function (event) {
        // TODO: Optimize - can do linear time.        
        for (var i = 0; i < this.parts.length; i++) {
            var partOfThis = this.parts[i];
            for (var j = 0; j < event.parts.length; j++) {
                var partOfThat = event.parts[j];
                if (partOfThis.isOverlapping(partOfThat)) {
                    return true;
                }
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
    
    MultiMonthCalendar.event = function (id, title, ranges) {
        return new Event(id, title, ranges);        
    };
    
    MultiMonthCalendar.range = function (start, end) {
        return new Range(start, end);
    };
    
    MultiMonthCalendar.date = function (year, month, day) {
        return new CalDate(year, month, day);
    };
    
 

    window.MultiMonthCalendar = MultiMonthCalendar;
    
})();
