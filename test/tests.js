QUnit.test("test MonthYear.shift", function (assert) {
    var monthYear = MultiMonthCalendar.monthYear(3, 2017);
    var shiftedMonthYear = monthYear.shift(5);
    assert.ok(shiftedMonthYear.month === 8);
    assert.ok(shiftedMonthYear.year === 2017);
    
    shiftedMonthYear = monthYear.shift(-5);
    assert.ok(shiftedMonthYear.month === 10);
    assert.ok(shiftedMonthYear.year === 2016);
    
    shiftedMonthYear = monthYear.shift(10);
    assert.ok(shiftedMonthYear.month === 1);
    assert.ok(shiftedMonthYear.year === 2018);
    
    shiftedMonthYear = monthYear.shift(0);
    assert.ok(shiftedMonthYear.month === 3);
    assert.ok(shiftedMonthYear.year === 2017);
});

QUnit.test("test MonthYear.getNumDays", function (assert) {
    // February 2017
    var monthYear = MultiMonthCalendar.monthYear(1, 2017);
    var numDays = monthYear.getNumDays();
    assert.ok(numDays === 28);
    
    // January 2015
    monthYear = MultiMonthCalendar.monthYear(0, 2015);
    numDays = monthYear.getNumDays();
    assert.ok(numDays === 31);
    
    // February 2020
    monthYear = MultiMonthCalendar.monthYear(1, 2020);
    numDays = monthYear.getNumDays();
    assert.ok(numDays === 29);
});

QUnit.test("test MonthYear.getWeekDay", function (assert) {
    // September 2017
    var monthYear = MultiMonthCalendar.monthYear(8, 2017);
    var weekDay = monthYear.getWeekDay(12);
    assert.ok(weekDay === 2);
    
    weekDay = monthYear.getWeekDay(13);
    assert.ok(weekDay === 3);
    
    var weekDay = monthYear.getWeekDay(17);
    assert.ok(weekDay === 0);
});

QUnit.test("test Event.isOverlapping", function (assert) {
    var C = MultiMonthCalendar;
    var event1 = C.event(1, "Posiedzenie 1", [C.range(C.date(2016, 3, 9), C.date(2016, 3, 24))]);
    var event2 = C.event(2, "Posiedzenie 2", [C.range(C.date(2016, 3, 24), C.date(2016, 3, 28))]);
    var event3 = C.event(3, "Posiedzenie 3", [C.range(C.date(2016, 3, 9), C.date(2016, 3, 9))]);
    var event4 = C.event(4, "Posiedzenie 4", [C.range(C.date(2016, 3, 7), C.date(2016, 3, 8))]);
    var event5 = C.event(5, "Posiedzenie 5", [C.range(C.date(2016, 3, 9), C.date(2016, 3, 9))]);
    var event6 = C.event(6, "Posiedzenie 6", [
        C.range(C.date(2016, 3, 3), C.date(2016, 3, 3)),
        C.range(C.date(2016, 3, 8), C.date(2016, 3, 8)),
        C.range(C.date(2016, 4, 1), C.date(2016, 4, 30))
    ]);
    var event7 = C.event(7, "Posiedzenie 7", [
        C.range(C.date(2016, 3, 2), C.date(2016, 3, 2)),
        C.range(C.date(2016, 5, 1), C.date(2016, 5, 10)),
        C.range(C.date(2016, 6, 1), C.date(2016, 6, 10))
    ]);
    var event8 = C.event(8, "Posiedzenie 8", [
        C.range(C.date(2016, 3, 4), C.date(2016, 3, 5)),
        C.range(C.date(2016, 3, 9), C.date(2016, 3, 24)),
        C.range(C.date(2016, 4, 30), C.date(2016, 4, 30))
    ]);
    assert.ok(   event1.isOverlapping(event2)); assert.ok(   event2.isOverlapping(event1));
    assert.ok(   event1.isOverlapping(event3)); assert.ok(   event3.isOverlapping(event1));
    assert.notOk(event1.isOverlapping(event4)); assert.notOk(event4.isOverlapping(event1));
    assert.ok(   event1.isOverlapping(event5)); assert.ok(   event5.isOverlapping(event1));
    assert.notOk(event1.isOverlapping(event6)); assert.notOk(event6.isOverlapping(event1));
    assert.notOk(event1.isOverlapping(event7)); assert.notOk(event7.isOverlapping(event1));
    assert.ok(   event1.isOverlapping(event8)); assert.ok(   event8.isOverlapping(event1));
    assert.notOk(event2.isOverlapping(event3)); assert.notOk(event3.isOverlapping(event2));
    assert.notOk(event2.isOverlapping(event4)); assert.notOk(event4.isOverlapping(event2));
    assert.notOk(event2.isOverlapping(event5)); assert.notOk(event5.isOverlapping(event2));
    assert.notOk(event2.isOverlapping(event6)); assert.notOk(event6.isOverlapping(event2));
    assert.notOk(event2.isOverlapping(event7)); assert.notOk(event7.isOverlapping(event2));
    assert.ok(   event2.isOverlapping(event8)); assert.ok(   event8.isOverlapping(event2));
    assert.notOk(event3.isOverlapping(event4)); assert.notOk(event4.isOverlapping(event3));
    assert.ok(   event3.isOverlapping(event5)); assert.ok(   event5.isOverlapping(event3));
    assert.notOk(event3.isOverlapping(event6)); assert.notOk(event6.isOverlapping(event3));
    assert.notOk(event3.isOverlapping(event7)); assert.notOk(event7.isOverlapping(event3));
    assert.ok(   event3.isOverlapping(event8)); assert.ok(   event8.isOverlapping(event3));
    assert.notOk(event4.isOverlapping(event5)); assert.notOk(event5.isOverlapping(event4));
    assert.ok(   event4.isOverlapping(event6)); assert.ok(   event6.isOverlapping(event4));
    assert.notOk(event4.isOverlapping(event7)); assert.notOk(event7.isOverlapping(event4));
    assert.notOk(event4.isOverlapping(event8)); assert.notOk(event8.isOverlapping(event4));
    assert.notOk(event5.isOverlapping(event6)); assert.notOk(event6.isOverlapping(event5));
    assert.notOk(event5.isOverlapping(event7)); assert.notOk(event7.isOverlapping(event5));
    assert.ok(   event5.isOverlapping(event8)); assert.ok(   event8.isOverlapping(event5));
    assert.notOk(event6.isOverlapping(event7)); assert.notOk(event7.isOverlapping(event6));
    assert.ok(   event6.isOverlapping(event8)); assert.ok(   event8.isOverlapping(event6));
    assert.notOk(event7.isOverlapping(event8)); assert.notOk(event8.isOverlapping(event7));
});

QUnit.test("test EventList.assignIndexAndColor", function (assert) {
    var C = MultiMonthCalendar;
    var list = C.eventList();
    var event0 = C.event(0, "Posiedzenie 13", [C.range(C.date(2016, 3, 5), C.date(2016, 3, 19))]);
    list.add(event0);
    var event1 = C.event(1, "Posiedzenie 14", [C.range(C.date(2016, 3, 9), C.date(2016, 3, 24))]);
    list.add(event1);
    var event2 = C.event(2, "Posiedzenie 15", [C.range(C.date(2016, 3, 15), C.date(2016, 3, 22))]);
    list.add(event2);
    var event3 = C.event(3, "Posiedzenie 16", [C.range(C.date(2016, 3, 18), C.date(2016, 3, 23))]);
    list.add(event3);
    var event4 = C.event(4, "Posiedzenie 17", [C.range(C.date(2016, 3, 20), C.date(2016, 3, 25))]);
    list.add(event4);
    var event5 = C.event(5, "Posiedzenie 18", [C.range(C.date(2016, 3, 24), C.date(2016, 3, 28))]);
    list.add(event5);
    var event6 = C.event(6, "Posiedzenie 19", [C.range(C.date(2016, 3, 28), C.date(2016, 3, 28))]);
    list.add(event6);
    var event7 = C.event(7, "Posiedzenie 20", [C.range(C.date(2016, 3, 28), C.date(2016, 3, 30))]);
    list.add(event7);
    var event8 = C.event(8, "Posiedzenie 21", [C.range(C.date(2016, 3, 28), C.date(2016, 3, 30))]);
    list.add(event8);
    var event9 = C.event(9, "Posiedzenie 22", [C.range(C.date(2016, 3, 29), C.date(2016, 3, 29))]);
    list.add(event9);
    var event10 = C.event(10, "Posiedzenie 23",[C.range(C.date(2016, 3, 29), C.date(2016, 3, 30))]);
    list.add(event10);
    var event11 =  C.event(11, "Posiedzenie 24", [
        C.range(C.date(2016, 4, 1), C.date(2016, 4, 1)),
        C.range(C.date(2016, 4, 3), C.date(2016, 4, 3)),
        C.range(C.date(2016, 4, 5), C.date(2016, 4, 5))
    ]);
    list.add(event11);
    var event12 =  C.event(12, "Posiedzenie 25", [
        C.range(C.date(2016, 4, 7), C.date(2016, 4, 8)),
        C.range(C.date(2016, 4, 10), C.date(2016, 4, 11)),
        C.range(C.date(2016, 4, 13), C.date(2016, 4, 14))
    ]);    
    list.add(event12);
    var event13 =  C.event(13, "Posiedzenie 26", [
        C.range(C.date(2016, 4, 8), C.date(2016, 4, 9)),
        C.range(C.date(2016, 4, 15), C.date(2016, 4, 15)),
        C.range(C.date(2016, 4, 20), C.date(2016, 4, 25))
    ]);    
    list.add(event13);
    var event14 =  C.event(14, "Posiedzenie 27", [        
        C.range(C.date(2016, 4, 10), C.date(2016, 4, 10)),
        C.range(C.date(2016, 4, 14), C.date(2016, 4, 15)),
        C.range(C.date(2016, 4, 17), C.date(2016, 4, 17)),
        C.range(C.date(2016, 4, 19), C.date(2016, 4, 19))
    ]);
    list.add(event14);
    list.assignIndexAndColor();
    
    var event0Model = list.findEventModelById(event0.id);
    assert.equal(event0Model.index, 0);
    
    var event1Model = list.findEventModelById(event1.id);
    assert.equal(event1Model.index, 1);
    
    var event2Model = list.findEventModelById(event2.id);
    assert.equal(event2Model.index, 2);
    
    var event3Model = list.findEventModelById(event3.id);
    assert.equal(event3Model.index, 3);

    var event4Model = list.findEventModelById(event4.id);
    assert.equal(event4Model.index, 0);
    
    var event5Model = list.findEventModelById(event5.id);
    assert.equal(event5Model.index, 2);
    
    var event6Model = list.findEventModelById(event6.id);
    assert.equal(event6Model.index, 0);

    var event7Model = list.findEventModelById(event7.id);
    assert.equal(event7Model.index, 1);
    
    var event8Model = list.findEventModelById(event8.id);
    assert.equal(event8Model.index, 3);
    
    var event9Model = list.findEventModelById(event9.id);
    assert.equal(event9Model.index, 0);
    
    var event10Model = list.findEventModelById(event10.id);
    assert.equal(event10Model.index, 2);
    
    var event11Model = list.findEventModelById(event11.id);
    assert.equal(event11Model.index, 0);
    
    var event12Model = list.findEventModelById(event12.id);
    assert.equal(event12Model.index, 0);
    
    var event13Model = list.findEventModelById(event13.id);
    assert.equal(event13Model.index, 1);
    
    var event14Model = list.findEventModelById(event14.id);
    assert.equal(event14Model.index, 2);
});

QUnit.test("test EventList.getSublistOverlapping_oneRange", function (assert) {
    var C = MultiMonthCalendar;
    var list = C.eventList();
     var event0 = C.event(0, "Posiedzenie 13", [C.range(C.date(2016, 3, 5), C.date(2016, 3, 19))]);
    list.add(event0);
    var event1 = C.event(1, "Posiedzenie 14", [C.range(C.date(2016, 3, 9), C.date(2016, 3, 24))]);
    list.add(event1);
    var event2 = C.event(2, "Posiedzenie 15", [C.range(C.date(2016, 3, 15), C.date(2016, 3, 22))]);
    list.add(event2);
    var event3 = C.event(3, "Posiedzenie 16", [C.range(C.date(2016, 3, 18), C.date(2016, 3, 23))]);
    list.add(event3);
    var event4 = C.event(4, "Posiedzenie 17", [C.range(C.date(2016, 3, 20), C.date(2016, 3, 25))]);
    list.add(event4);
    var event5 = C.event(5, "Posiedzenie 18", [C.range(C.date(2016, 3, 24), C.date(2016, 3, 28))]);
    list.add(event5);
    var event6 = C.event(6, "Posiedzenie 19", [C.range(C.date(2016, 3, 28), C.date(2016, 3, 28))]);
    list.add(event6);
    var event7 = C.event(7, "Posiedzenie 20", [C.range(C.date(2016, 3, 28), C.date(2016, 3, 30))]);
    list.add(event7);
    var event8 = C.event(8, "Posiedzenie 21", [C.range(C.date(2016, 3, 28), C.date(2016, 3, 30))]);
    list.add(event8);
    var event9 = C.event(9, "Posiedzenie 22", [C.range(C.date(2016, 3, 29), C.date(2016, 3, 29))]);
    list.add(event9);
    var event10 = C.event(10, "Posiedzenie 23",[C.range(C.date(2016, 3, 29), C.date(2016, 3, 30))]);
    list.add(event10);
   
    var sublist = list.getSublistOverlapping(
            C.range(C.date(2016, 3, 23), C.date(2016, 3, 27)), false);
    assert.ok(sublist.findEventModelById(event0.id) === null);
    assert.ok(sublist.findEventModelById(event1.id) !== null);
    assert.ok(sublist.findEventModelById(event2.id) === null);
    assert.ok(sublist.findEventModelById(event3.id) !== null);
    assert.ok(sublist.findEventModelById(event4.id) !== null);
    assert.ok(sublist.findEventModelById(event5.id) !== null);
    assert.ok(sublist.findEventModelById(event6.id) === null);
    assert.ok(sublist.findEventModelById(event7.id) === null);
    assert.ok(sublist.findEventModelById(event8.id) === null);
    assert.ok(sublist.findEventModelById(event9.id) === null);
    assert.ok(sublist.findEventModelById(event10.id) === null);
});

QUnit.test("test EventList.getSublistOverlapping_multiRange", function (assert) {
    var C = MultiMonthCalendar;
    var list = C.eventList();
    var event11 =  C.event(11, "Posiedzenie 24", [
        C.range(C.date(2016, 4, 1), C.date(2016, 4, 1)),
        C.range(C.date(2016, 4, 3), C.date(2016, 4, 3)),
        C.range(C.date(2016, 4, 5), C.date(2016, 4, 5))
    ]);
    list.add(event11);
    var event12 =  C.event(12, "Posiedzenie 25", [
        C.range(C.date(2016, 4, 7), C.date(2016, 4, 8)),
        C.range(C.date(2016, 4, 10), C.date(2016, 4, 11)),
        C.range(C.date(2016, 4, 13), C.date(2016, 4, 14))
    ]);    
    list.add(event12);
    var event13 =  C.event(13, "Posiedzenie 26", [
        C.range(C.date(2016, 4, 8), C.date(2016, 4, 9)),
        C.range(C.date(2016, 4, 15), C.date(2016, 4, 15)),
        C.range(C.date(2016, 4, 20), C.date(2016, 4, 25))
    ]);    
    list.add(event13);
    var event14 =  C.event(14, "Posiedzenie 27", [        
        C.range(C.date(2016, 4, 10), C.date(2016, 4, 10)),
        C.range(C.date(2016, 4, 14), C.date(2016, 4, 15)),
        C.range(C.date(2016, 4, 17), C.date(2016, 4, 17)),
        C.range(C.date(2016, 4, 19), C.date(2016, 4, 19))
    ]);    
    list.add(event14);
   
    var sublist = list.getSublistOverlapping(
            C.range(C.date(2016, 4, 10), C.date(2016, 4, 13)), false);
    event11 = sublist.findEventModelById(event11.id);
    assert.ok(event11 === null);
    event12 = sublist.findEventModelById(event12.id);
    assert.ok(event12 !== null);
    event13 = sublist.findEventModelById(event13.id);
    assert.ok(event13 === null);
    event14 = sublist.findEventModelById(event14.id);
    assert.ok(event14 !== null);
    
    var parts = event12.event.parts;
    assert.equal(parts.length, 2);
    assert.deepEqual(parts[0].start, C.date(2016, 4, 10).toJSDate());
    assert.deepEqual(parts[0].end, C.date(2016, 4, 11).toJSDate());
    assert.deepEqual(parts[1].start, C.date(2016, 4, 13).toJSDate());
    assert.deepEqual(parts[1].end, C.date(2016, 4, 13).toJSDate());
    parts = event14.event.parts;
    assert.equal(parts.length, 1);
    assert.deepEqual(parts[0].start, C.date(2016, 4, 10).toJSDate());
    assert.deepEqual(parts[0].end, C.date(2016, 4, 10).toJSDate());
});

QUnit.test("test MultiMonthCalendar.shrinkDayCells_noEventsAndPlaceholder", function (assert) {
    var C = MultiMonthCalendar;
    var weekRow = document.createElement("tr");
    for (var i = 0; i < 7; i++) {
        var td = document.createElement("td");
        var dayNumDiv = document.createElement('div'); // Child 0 of each <td>
        dayNumDiv.innerHTML = i;
        td.appendChild(dayNumDiv);
        td.appendChild(document.createElement('div')); // Child 1 of each <td>
        weekRow.appendChild(td);
    }
    C.shrinkDayCells(weekRow, null);
    for (var i = 0; i < 7; i++) {
        assert.equal(weekRow.childNodes[i].childNodes.length, 2);
    }
});

QUnit.test("test MultiMonthCalendar.shrinkDayCells_3EventsButNotThisWeek", function (assert) {
    var C = MultiMonthCalendar;
    var weekRow = document.createElement("tr");
    for (var i = 0; i < 7; i++) {
        var td = document.createElement("td");
        var dayNumDiv = document.createElement('div'); // Child 0 of each <td>
        dayNumDiv.innerHTML = i;
        td.appendChild(dayNumDiv);
        td.appendChild(document.createElement('div')); // Child 1 of each <td>
        td.appendChild(document.createElement('div')); // Child 2 of each <td>
        td.appendChild(document.createElement('div')); // Child 3 of each <td>
        weekRow.appendChild(td);
    }
    C.shrinkDayCells(weekRow, 2); // Param "2" means 3 events (indices 0, 1, 2).
    for (var i = 0; i < 7; i++) {
        // shrinkDayCells should have cut out two rows of indicators, leaving 2 children.
        assert.equal(weekRow.childNodes[i].childNodes.length, 2);
    }
});

QUnit.test("test MultiMonthCalendar.shrinkDayCells_3EventsOfWhich2ThisWeek", function (assert) {
    var C = MultiMonthCalendar;
    var weekRow = document.createElement("tr");
    for (var i = 0; i < 7; i++) {
        var td = document.createElement("td");
        var dayNumDiv = document.createElement('div'); // Child 0 of each <td>
        dayNumDiv.innerHTML = i;
        td.appendChild(dayNumDiv);
        td.appendChild(document.createElement('div')); // Child 1 of each <td>
        td.appendChild(document.createElement('div')); // Child 2 of each <td>
        td.appendChild(document.createElement('div')); // Child 3 of each <td>
        weekRow.appendChild(td);
    }
    
    // 4-th child will have real event in last indicator.
    weekRow.childNodes[3].removeChild(weekRow.childNodes[3].childNodes[3]);
    weekRow.childNodes[3].appendChild(C.createNewElement('div', ['event']));
    
    // 5-th child will have real events in last two indicators.
    weekRow.childNodes[4].removeChild(weekRow.childNodes[4].childNodes[3]);
    weekRow.childNodes[4].removeChild(weekRow.childNodes[4].childNodes[2]);
    weekRow.childNodes[4].appendChild(C.createNewElement('div', ['event']));
    weekRow.childNodes[4].appendChild(C.createNewElement('div', ['event']));
    
    
    C.shrinkDayCells(weekRow, 2); // Param "2" means 3 events (indices 0, 1, 2).
    for (var i = 0; i < 7; i++) {
        // shrinkDayCells should have cut out one row of indicators, leaving 3 children.
        assert.equal(weekRow.childNodes[i].childNodes.length, 3);
    }
});

QUnit.test("test MultiMonthCalendar.shrinkDayCells_3EventsAllThisWeek", function (assert) {
    var C = MultiMonthCalendar;
    var weekRow = document.createElement("tr");
    for (var i = 0; i < 7; i++) {
        var td = document.createElement("td");
        var dayNumDiv = document.createElement('div'); // Child 0 of each <td>
        dayNumDiv.innerHTML = i;
        td.appendChild(dayNumDiv);
        td.appendChild(document.createElement('div')); // Child 1 of each <td>
        td.appendChild(document.createElement('div')); // Child 2 of each <td>
        td.appendChild(document.createElement('div')); // Child 3 of each <td>
        weekRow.appendChild(td);
    }
    
    // 4-th child will have real event in last indicator.
    weekRow.childNodes[3].removeChild(weekRow.childNodes[3].childNodes[3]);
    weekRow.childNodes[3].appendChild(C.createNewElement('div', ['event']));
    
    // 5-th child will have real events in last two indicators.
    weekRow.childNodes[4].removeChild(weekRow.childNodes[4].childNodes[3]);
    weekRow.childNodes[4].removeChild(weekRow.childNodes[4].childNodes[2]);
    weekRow.childNodes[4].appendChild(C.createNewElement('div', ['event']));
    weekRow.childNodes[4].appendChild(C.createNewElement('div', ['event']));
    
    // 7-th child will have real event in first indicator.
    weekRow.childNodes[6].removeChild(weekRow.childNodes[6].childNodes[3]);
    weekRow.childNodes[6].removeChild(weekRow.childNodes[6].childNodes[2]);
    weekRow.childNodes[6].removeChild(weekRow.childNodes[6].childNodes[1]);
    weekRow.childNodes[6].appendChild(C.createNewElement('div', ['event']));
    weekRow.childNodes[6].appendChild(document.createElement('div')); // Empty indicator
    weekRow.childNodes[6].appendChild(document.createElement('div')); // Empty indicator
    
    C.shrinkDayCells(weekRow, 2); // Param "2" means 3 events (indices 0, 1, 2).
    for (var i = 0; i < 7; i++) {
        // shrinkDayCells should have cut out no rows of indicators, leaving 4 children.
        assert.equal(weekRow.childNodes[i].childNodes.length, 4);
    }
});
