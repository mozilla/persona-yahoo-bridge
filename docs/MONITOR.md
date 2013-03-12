Monitoring Notes
================

There are many counters set to measure BigTent performance
and to detect service errors.

## Routes

For a route $foo which handles a GET request, the following will be set

### Counter
* routes.$foo.get
* routes.$foo.err - Grepping code will reveal error or types of errors

### Timing
* routes.$foo - Amount of time it took to service the request