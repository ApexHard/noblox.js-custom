// Includes
const http = require('../util/http.js').func
const getGeneralToken = require('../util/getGeneralToken.js').func

// Args
exports.required = ['group']
exports.optional = ['message', 'jar']

// Docs
/**
 * 🔐 Change a group's shout.
 * @category Group
 * @alias shout
 * @param {number} group - The id of the group.
 * @param {string=} [message=""] - The message to shout
 * @returns {Promise<GroupShout>}
 * @example const noblox = require("noblox.js")
 * // Login using your cookie
 * noblox.shout(1, "Hello world!")
**/

exports.func = function (args) {
  const latest = args.getLatest

  let delay = args.delay
  delay = (typeof delay === 'string' || delay instanceof String ? settings.event[delay] : delay) || settings.event.defaultDelay

  let retries = 0
  const max = settings.event.maxRetries
  const timeout = args.timeout ?? settings.event.timeout

  let stop = false
  let current

  const evt = new events.EventEmitter()

  const run = function (value) {
    if (stop) return

    let promise = latest(value, evt)
    if (timeout > 0) {
      promise = promiseTimeout(promise, timeout)
    }

    return promise.then(function (response) {
        if (stop) return

        if (value === -1) {
          current = response.latest
        }

        retries = 0

        const data = response.data || []

        if (data.length > 0 && (value !== -1 || current === -2)) {
          current = response.latest
          for (let i = 0; i < data.length; i++) {
            evt.emit('data', data[i])
          }
        }

        if (response.repeat) {
          run(current)
        } else {
          setTimeout(run, delay, current)
        }

        return response
      })
      .catch(function (err) {
        if (stop) return

        evt.emit('error', err)
        retries++

        if (retries > max) {
          process.nextTick(() => {
            evt.emit('close', new Error('Max retries reached'))
          })
        } else {
          setTimeout(run, delay, current)
        }
      })
  }

  run(-1)
    .then(function (response) {
      if (stop) return
      evt.emit('connect', response.latest)
    })
    .catch(function (err) {
      process.nextTick(() => {
        evt.emit(
          'close',
          new Error('Initialization failed: ' + (err?.message || String(err)))
        )
      })
    })

  evt.on('close', function (err) {
    stop = true

    if (err) {
      try {
        if (evt.listenerCount('error') > 0) {
          process.nextTick(() => evt.emit('error', err))
        }
      } catch {}
    }
  })

  return evt
}
