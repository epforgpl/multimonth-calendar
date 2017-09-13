QUnit.test("test MonthYear.shift", function (assert) {
    var monthYear = MultiMonthCalendar.newMonthYear(3, 2017);
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
    var monthYear = MultiMonthCalendar.newMonthYear(1, 2017);
    var numDays = monthYear.getNumDays();
    assert.ok(numDays === 28);
    
    // January 2015
    monthYear = MultiMonthCalendar.newMonthYear(0, 2015);
    numDays = monthYear.getNumDays();
    assert.ok(numDays === 31);
    
    // February 2020
    monthYear = MultiMonthCalendar.newMonthYear(1, 2020);
    numDays = monthYear.getNumDays();
    assert.ok(numDays === 29);
});

QUnit.test("test MonthYear.getWeekDay", function (assert) {
    // September 2017
    var monthYear = MultiMonthCalendar.newMonthYear(8, 2017);
    var weekDay = monthYear.getWeekDay(12);
    assert.ok(weekDay === 2);
    
    weekDay = monthYear.getWeekDay(13);
    assert.ok(weekDay === 3);
    
    var weekDay = monthYear.getWeekDay(17);
    assert.ok(weekDay === 0);
});

QUnit.test("test Event.isOverlapping", function (assert) {
    var C = MultiMonthCalendar;
    var event1 = C.newEvent(1, "Posiedzenie 14", [
        C.newRange(C.newCalDate(2016, 3, 9), C.newCalDate(2016, 3, 24))
    ]);
    var event2 = C.newEvent(2, "Posiedzenie 18", [
        C.newRange(C.newCalDate(2016, 3, 24), C.newCalDate(2016, 3, 28))
    ]);
    var event3 = C.newEvent(3, "Posiedzenie 18", [
        C.newRange(C.newCalDate(2016, 3, 9), C.newCalDate(2016, 3, 9))
    ]);
    var event4 = C.newEvent(4, "Posiedzenie 18", [
        C.newRange(C.newCalDate(2016, 3, 7), C.newCalDate(2016, 3, 8))
    ]);
    var event5 = C.newEvent(5, "Posiedzenie 18", [
        C.newRange(C.newCalDate(2016, 3, 9), C.newCalDate(2016, 3, 9))
    ]);
    assert.ok(event1.isOverlapping(event2));
    assert.ok(event1.isOverlapping(event2));
    assert.ok(event1.isOverlapping(event3));
    assert.notOk(event1.isOverlapping(event4));
    assert.ok(event1.isOverlapping(event2));
    assert.ok(event3.isOverlapping(event5));
    assert.notOk(event2.isOverlapping(event3));
    assert.notOk(event3.isOverlapping(event4));
});

QUnit.test("test EventList.assignIndexAndColor", function (assert) {
    var C = MultiMonthCalendar;
    var list = C.newEventList();
    var event0 = C.newEvent(0, "Posiedzenie 13", [
        C.newRange(C.newCalDate(2016, 3, 5), C.newCalDate(2016, 3, 19))
    ]);
    list.add(event0);
    var event1 = C.newEvent(1, "Posiedzenie 14", [
        C.newRange(C.newCalDate(2016, 3, 9), C.newCalDate(2016, 3, 24))
    ]);
    list.add(event1);
    var event2 = C.newEvent(2, "Posiedzenie 15", [
        C.newRange(C.newCalDate(2016, 3, 15), C.newCalDate(2016, 3, 22))
    ]);
    list.add(event2);
    var event3 = C.newEvent(3, "Posiedzenie 16", [
        C.newRange(C.newCalDate(2016, 3, 18), C.newCalDate(2016, 3, 23))
    ]);
    list.add(event3);
    var event4 = C.newEvent(4, "Posiedzenie 17", [
        C.newRange(C.newCalDate(2016, 3, 20), C.newCalDate(2016, 3, 25))
    ]);
    list.add(event4);
    var event5 = C.newEvent(5, "Posiedzenie 18", [
        C.newRange(C.newCalDate(2016, 3, 24), C.newCalDate(2016, 3, 28))
    ]);
    list.add(event5);
    var event6 = C.newEvent(6, "Posiedzenie 19", [
        C.newRange(C.newCalDate(2016, 3, 28), C.newCalDate(2016, 3, 28))
    ]);
    list.add(event6);
    var event7 = C.newEvent(7, "Posiedzenie 20", [
        C.newRange(C.newCalDate(2016, 3, 28), C.newCalDate(2016, 3, 30))
    ]);
    list.add(event7);
    var event8 = C.newEvent(8, "Posiedzenie 21", [
        C.newRange(C.newCalDate(2016, 3, 28), C.newCalDate(2016, 3, 30))
    ]);
    list.add(event8);
    var event9 = C.newEvent(9, "Posiedzenie 22", [
        C.newRange(C.newCalDate(2016, 3, 29), C.newCalDate(2016, 3, 29))
    ]);
    list.add(event9);
    var event10 = C.newEvent(10, "Posiedzenie 23", [
        C.newRange(C.newCalDate(2016, 3, 29), C.newCalDate(2016, 3, 30))
    ]);
    list.add(event10);
    
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
});

QUnit.test("test EventList.getSublistOverlapping", function (assert) {
    var C = MultiMonthCalendar;
    var list = C.newEventList();
    var event0 = C.newEvent(0, "Posiedzenie 13", [
        C.newRange(C.newCalDate(2016, 3, 5), C.newCalDate(2016, 3, 19))
    ]);
    list.add(event0);
    var event1 = C.newEvent(1, "Posiedzenie 14", [
        C.newRange(C.newCalDate(2016, 3, 9), C.newCalDate(2016, 3, 24))
    ]);
    list.add(event1);
    var event2 = C.newEvent(2, "Posiedzenie 15", [
        C.newRange(C.newCalDate(2016, 3, 15), C.newCalDate(2016, 3, 22))
    ]);
    list.add(event2);
    var event3 = C.newEvent(3, "Posiedzenie 16", [
        C.newRange(C.newCalDate(2016, 3, 18), C.newCalDate(2016, 3, 23))
    ]);
    list.add(event3);
    var event4 = C.newEvent(4, "Posiedzenie 17", [
        C.newRange(C.newCalDate(2016, 3, 20), C.newCalDate(2016, 3, 25))
    ]);
    list.add(event4);
    var event5 = C.newEvent(5, "Posiedzenie 18", [
        C.newRange(C.newCalDate(2016, 3, 24), C.newCalDate(2016, 3, 28))
    ]);
    list.add(event5);
    var event6 = C.newEvent(6, "Posiedzenie 19", [
        C.newRange(C.newCalDate(2016, 3, 28), C.newCalDate(2016, 3, 28))
    ]);
    list.add(event6);
    var event7 = C.newEvent(7, "Posiedzenie 20", [
        C.newRange(C.newCalDate(2016, 3, 28), C.newCalDate(2016, 3, 30))
    ]);
    list.add(event7);
    var event8 = C.newEvent(8, "Posiedzenie 21", [
        C.newRange(C.newCalDate(2016, 3, 28), C.newCalDate(2016, 3, 30))
    ]);
    list.add(event8);
    var event9 = C.newEvent(9, "Posiedzenie 22", [
        C.newRange(C.newCalDate(2016, 3, 29), C.newCalDate(2016, 3, 29))
    ]);
    list.add(event9);
    var event10 = C.newEvent(10, "Posiedzenie 23", [
        C.newRange(C.newCalDate(2016, 3, 29), C.newCalDate(2016, 3, 30))
    ]);
    list.add(event10);
   
    var sublist = list.getSublistOverlapping(
            C.newRange(C.newCalDate(2016, 3, 23), C.newCalDate(2016, 3, 27)), false);
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
