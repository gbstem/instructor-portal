<script>
  import Nav from '$lib/components/Nav.svelte'
  import { user, db } from '$lib/firebase'
  import { onMount } from 'svelte'
  import { getDoc, doc } from 'firebase/firestore'

  $: if (!($user?.emailVerified ?? true)) {
    sessionStorage.setItem('emailVerified', 'false')
  }

  let applicationType
  async function getApplicationType() {
    const profileDoc = await getDoc(doc($db, 'users', $user.uid))
    const profileDocData = profileDoc.data()
    applicationType = profileDocData.applicationType
  }

  onMount(async () => {
    if (sessionStorage.getItem('emailVerified') === 'false' && $user.emailVerified) {
      const { getIdToken } = await import('firebase/auth')
      getIdToken($user, true).then(() => {
        sessionStorage.removeItem('emailVerified')
      })
    }
    getApplicationType()
  })
</script>

<Nav bind:applicationType />
<slot />
