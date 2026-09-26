const MAX_SIDE = 1280
const QUALITY = 0.72

/**
 * Turns a picked image into a compressed JPEG data URL, small enough to be
 * stored on the order row and shown to the driver. (A blob: URL would only
 * work in the customer's own browser tab.)
 */
export function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(image.width * scale)
      canvas.height = Math.round(image.height * scale)

      const context = canvas.getContext('2d')
      URL.revokeObjectURL(objectUrl)
      if (!context) {
        reject(new Error('Canvas not available'))
        return
      }
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', QUALITY))
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Image could not be read'))
    }

    image.src = objectUrl
  })
}
