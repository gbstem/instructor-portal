import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { user } from '$lib/firebase'

export async function load() {
  if (browser) {
    const userData = await user.get()
    if (userData) {
      goto('/apply')
    }
  }
}
