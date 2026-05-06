const CLOUD_NAME = 'dqiqqpfqi'
const UPLOAD_PRESET = 'frame_uploads'

export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', UPLOAD_PRESET)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Cloudinary upload failed (${res.status}): ${body}`)
  }
  const json = await res.json()
  return json.secure_url as string
}
