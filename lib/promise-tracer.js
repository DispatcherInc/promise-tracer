var _ = require('lodash');
var Q = require('bluebird-q');

function PromiseTracer() {
    'use strict';

    var startTime = new Date().getTime();

    var segments = {};
    var childTracers = [];

    this.getSegments = function() {
        var combinedSegments = _.clone(segments);
        _.each(childTracers, function(ct) {
            combinedSegments[ct.name] = ct.getSegments();
        });
        return combinedSegments;
    };

    this.child = function(name) {
        var childTracer = new Tracer();
        childTracer.name = name || 'child' + childTracers.length;
        childTracers.push(childTracer);
        return childTracer;
    };

    this.markSegmentStart = function(segmentName, details) {
        segments[segmentName] = {
            startTime: new Date().getTime(),
            details: details
        };
    };

    this.markSegmentEnd = function(segmentName) {
        var segment = segments[segmentName] = segments[segmentName] || {
            startTime: startTime
        };

        segment.endTime = new Date().getTime();
        segment.totalTimeSpentInMs = (segment.endTime - segment.startTime) || 0;
    };

    this.wrapQ = function(name, details, promise) {
        if (!promise) {
            promise = details;
            details = undefined;
        }

        this.markSegmentStart(name, details);

        return Q.resolve(promise).finally(function() {
            this.markSegmentEnd(name);
        }.bind(this));
    };

    this.wrapSyncSegment = function(name, details, segmentFunc) {
        this.markSegmentStart(name, details);
        var result = segmentFunc();
        this.markSegmentEnd(name);
        return result;
    };
}

module.exports = PromiseTracer;
