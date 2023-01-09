<script>
  import Select from '$lib/components/Select.svelte'
  import { classNames } from '$lib/utils'
  import { createFields, isValid } from '$lib/forms'
  import { user, db } from '$lib/firebase'
  import { doc, getDoc, updateDoc } from 'firebase/firestore'
  import { onMount } from 'svelte'

  let modalEl
  let formEl
  let showValidation = false
  let fields = {
    default: createFields.text('applicantType')
  }

  onMount(async () => {
    const userDoc = await getDoc(doc($db, 'users', $user.uid))
    const userDocData = userDoc.data()
    if (userDocData.applicationType === 'register') {
      fields.default.applicantType.value = 'parent registering my child to take gbSTEM courses'
    } else if (userDocData.applicationType === 'apply') {
      fields.default.applicantType.value = 'high school student applying to be an instructor'
    }
  })

  function handleSubmit() {
    showValidation = true
    let applicationType = 'register'
    if (
      fields.default.applicantType.value === 'parent registering my child to take gbSTEM courses'
    ) {
      applicationType = 'register'
    } else if (
      fields.default.applicantType.value === 'high school student applying to be an instructor'
    ) {
      applicationType = 'apply'
    } else {
      alert.trigger('error', 'Invalid application type', false)
    }
    if (isValid(formEl)) {
      updateDoc(doc($db, 'users', $user.uid), {
        applicationType
      })
    }
  }
</script>

<form
  class={classNames('max-w-lg w-full grid', showValidation && 'show-validation')}
  bind:this={formEl}
  on:submit|preventDefault={handleSubmit}
  novalidate
>
  <div class="grid gap-1">
    <span class="font-bold">Change application type</span>
    <div class="relative">
      <Select
        bind:field={fields.default.applicantType}
        placeholder="I am a ..."
        floating
        required
        sourceJson={[
          { name: 'parent registering my child to take gbSTEM courses' },
          { name: 'high school student applying to be an instructor' }
        ]}
      />
      <div class="absolute top-2 right-2 h-12 flex items-center">
        <button
          class="shadow-sm rounded-md bg-blue-100 px-2 py-1 text-blue-900 hover:bg-blue-200 transition-colors duration-300"
          type="submit"
        >
          Update
        </button>
      </div>
    </div>
  </div>
</form>
