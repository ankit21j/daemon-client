export const createChannel = () => {
  const map = {}
  return {
    pub: (event, data) => {
      map[event] = map[event] || []
      map[event].forEach(callback => {
        if (typeof callback === "function") {
          callback.call(null, data)
        }
      })
    },
    sub: (event, callback) => {
      map[event] = map[event] || []
      map[event].push(callback)
    }
  }
}
