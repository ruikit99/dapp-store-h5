class SafepalConnectorH5 {
  callbacks = new Map<string, (error: any, data: any) => void>()
  isDebug = false

  constructor(config: { isDebug?: boolean } = {}) {
    this.isDebug = !!config.isDebug
  }

  request(payload: any) {
    return this._request(payload)
  }

  _request(payload: any) {
    return new Promise((resolve, reject) => {
      if (!payload.id) {
        payload.id = Date.now() + ''
      }
      this.callbacks.set(payload.id, (error, data) => {
        if (error) reject(error)
        else resolve(data)
      })
      this.postMessage(payload)
    })
  }

  postMessage(object: any) {
    try {
      ;(window as any).safepalConnector?.postMessage(JSON.stringify(object))
    } catch (error) {
      this.sendError(object.id, error)
    }
  }

  sendResponse(id: string, result: any) {
    const callback = this.callbacks.get(id)
    if (callback) {
      callback(null, result)
      this.callbacks.delete(id)
    }
  }

  sendError(id: string, error: any) {
    const callback = this.callbacks.get(id)
    if (callback) {
      callback(error instanceof Error ? error : new Error(String(error)), null)
      this.callbacks.delete(id)
    }
  }
}

export function initSafepalConnectorH5() {
  if (!(window as any).safepalConnectorH5) {
    ;(window as any).safepalConnectorH5 = {
      h5: new SafepalConnectorH5(),
    }
  }
}

export async function getClientData() {
  try {
    const data = await (window as any).safepalConnectorH5?.h5?.request({ method: 'getClient' })
    return data
  } catch {
    return null
  }
}

export default initSafepalConnectorH5
