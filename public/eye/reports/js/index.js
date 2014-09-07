var app = {
    initialize: function () {
        ko.applyBindings(this);
    },
    historyData: ko.observableArray([]);
};

$(function () {
    app.initialize();
});
