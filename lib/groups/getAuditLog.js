// Includes
const http = require('../util/http.js').func

exports.required = ['group']
exports.optional = ['actionType', 'userId', 'sortOrder', 'limit', 'cursor', 'jar']

// Docs
/**
 * 🔐 Get the audit log for the group.
 * @category Group
 * @alias getAuditLog
 * @param {number} group - The id of the group.
 * @param {("DeletePost" | "RemoveMember" | "AcceptJoinRequest" | "DeclineJoinRequest" | "PostStatus" | "ChangeRank" | "BuyAd" | "SendAllyRequest" | "CreateEnemy" | "AcceptAllyRequest" | "DeclineAllyRequest" | "DeleteAlly" | "DeleteEnemy" | "AddGroupPlace" | "RemoveGroupPlace" | "CreateItems" | "ConfigureItems" | "SpendGroupFunds" | "ChangeOwner" | "Delete" | "AdjustCurrencyAmounts" | "Abandon" | "Claim" | "Rename" | "ChangeDescription" | "InviteToClan" | "KickFromClan" | "CancelClanInvite" | "BuyClan" | "CreateGroupAsset" | "UpdateGroupAsset" | "ConfigureGroupAsset" | "RevertGroupAsset" | "CreateGroupDeveloperProduct" | "ConfigureGroupGame" | "Lock" | "Unlock" | "CreateGamePass" | "CreateBadge" | "ConfigureBadge" | "SavePlace" | "PublishPlace")=} actionType - The action type to filter for.
 * @param {number=} userId - The user's id to filter for.
 * @param {SortOrder=} sortOrder - The order to sort the logs by.
 * @param {Limit=} limit - The maximum logs per a page.
 * @param {string=} cursor - The cursor for the page.
 * @returns {Promise<AuditPage>}
 * @example const noblox = require("noblox.js")
 * // Login using your cookie
 * const rankLogs = await noblox.getAuditLog(1, "ChangeRank", 2, "Asc")
**/

function getAuditLog (group, actionType, userId, sortOrder, limit, cursor, jar) {
  return new Promise((resolve) => {

    if (!jar) {
      return resolve({
        data: [],
        nextPageCursor: cursor || null,
        error: 'Authentication jar is required to access the audit log'
      })
    }

    const params = new URLSearchParams()
    if (actionType) params.append('actionType', actionType)
    if (userId) params.append('userId', userId)
    if (cursor) params.append('cursor', cursor)

    params.append('sortOrder', sortOrder || 'Asc')
    params.append('limit', limit || 100)

    const httpOpt = {
      url: `https://groups.roblox.com/v1/groups/${group}/audit-log?${params.toString()}`,
      options: {
        method: 'GET',
        resolveWithFullResponse: true,
        jar
      }
    }

    http(httpOpt)
      .then((res) => {
        let responseData
        try {
          responseData = JSON.parse(res.body)
        } catch (e) {
          console.warn('[getAuditLog] Invalid JSON')
          return resolve({
            data: [],
            nextPageCursor: cursor || null,
            error: 'Invalid JSON response'
          })
        }

        if (res.statusCode !== 200) {
          const error =
            responseData?.errors?.map(e => e.message).join('\n') ||
            `HTTP ${res.statusCode}`

          console.warn('[getAuditLog]', error)

          return resolve({
            data: [],
            nextPageCursor: responseData?.nextPageCursor || cursor || null,
            error
          })
        }

        const data = (responseData.data || []).map(entry => {
          entry.created = new Date(entry.created)
          entry.created.setMilliseconds(0)
          return entry
        })

        resolve({data, nextPageCursor: responseData.nextPageCursor || null})
      })
      .catch((err) => {
        console.error('[getAuditLog]', err?.message || err)
        resolve({
          data: [],
          nextPageCursor: cursor || null,
          error: err?.message || String(err)
        })
      })
  })
}

// Define
exports.func = function (args) {
  const jar = args.jar
  const actionType = args.actionType || ''
  const userId = args.userId || ''
  const sortOrder = args.sortOrder || 'Asc'
  const limit = args.limit || (100).toString()
  const cursor = args.cursor || ''
  return getAuditLog(args.group, actionType, userId, sortOrder, limit, cursor, jar)
}
