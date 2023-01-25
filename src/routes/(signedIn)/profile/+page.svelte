<script>
  import ChangeEmailForm from '$lib/forms/ChangeEmailForm.svelte'
  import ChangePasswordForm from '$lib/forms/ChangePasswordForm.svelte'
  import ChangeRoleForm from '$lib/forms/ChangeRoleForm.svelte'
  import { fade } from 'svelte/transition'
  import { user, db } from '$lib/firebase'
  import { sendEmailVerification } from 'firebase/auth'
  import { alert } from '$lib/stores'
  import ChangeNameForm from '$lib/forms/ChangeNameForm.svelte'
  import { onMount } from 'svelte'
  import { getDoc, doc } from 'firebase/firestore'
  import Card from '$lib/components/Card.svelte'

  let id = ''
  $: emailVerified = $user?.emailVerified ?? true
  onMount(async () => {
    getDoc(doc($db, 'users', $user.uid)).then(res => {
      const profile = res.data()
      id = profile.id
    })
  })
  function handleVerificationEmail() {
    sendEmailVerification($user).then(() => {
      alert.trigger('info', 'Verification email was sent.')
    })
  }
</script>

<div class="grid md:grid-cols-2">
  <h1 class="font-bold text-5xl md:text-6xl mb-8">Profile</h1>
  <div class="flex flex-col gap-6 items-center">
    {#if !emailVerified}
      <div
        class="max-w-lg w-full p-3 rounded-md shadow flex items-center gap-2 bg-red-200 mt-2"
        transition:fade
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <div class="grow">
          Email is not verified. Please check your email and verify to use the portal. Can't find
          it? <button class="link" type="button" on:click={handleVerificationEmail}
            >Send it again.</button
          >
        </div>
      </div>
    {/if}
    <Card class="max-w-lg grid gap-3">
      <div class="bg-gray-100 shadow-sm rounded-md px-3 py-2">
        {`ID: ${id}`}
      </div>
      <div class="text-sm">Any problems with changing your profile? Contact us.</div>
    </Card>
    <ChangeNameForm />
    <ChangeEmailForm />
    <ChangePasswordForm />
  </div>
</div>
