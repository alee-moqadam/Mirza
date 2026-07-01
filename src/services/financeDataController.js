export function createFinanceDataController({
  read,
  write,
  restore,
  initialData,
  onChange = () => {},
  onError = error => console.error('Finance data mutation failed:', error),
} = {}) {
  if (typeof read !== 'function') throw new Error('Finance data controller requires a read function.')
  if (typeof write !== 'function') throw new Error('Finance data controller requires a write function.')

  let currentData = initialData ?? read()
  let version = 0

  const publish = nextData => {
    currentData = nextData
    version += 1
    onChange(currentData, version)
    return currentData
  }

  const refreshData = () => publish(read())

  const mutateData = updater => {
    try {
      const nextData = typeof updater === 'function' ? updater(currentData) : updater
      write(nextData)
      return refreshData()
    } catch (error) {
      onError(error)
      return currentData
    }
  }

  const resetData = () => {
    try {
      const restored = typeof restore === 'function' ? restore() : read()
      return publish(restored)
    } catch (error) {
      onError(error)
      return currentData
    }
  }

  return {
    getData: () => currentData,
    getVersion: () => version,
    refreshData,
    mutateData,
    resetData,
  }
}
