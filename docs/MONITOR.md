Monitoring Notes
================

Redis
-----

The following counters are set:

Association Handles:
* assoc_store.redis.get.ok - A handle was successfully retrieved
* assoc_store.redis.get.error - A redis error occured, see logs
* assoc_store.redis.setandexpire.ok - A handle was successfully saved
* assoc_store.redis.set.error - A redis SET error occured, see logs
* assoc_store.redis.set.failure - A redis SET library error occured
* assoc_store.redis.expire.error - A redis EXPIRE error occured, see logs
* assoc_store.redis.expire.failure - A redis EXPIRE library error occured