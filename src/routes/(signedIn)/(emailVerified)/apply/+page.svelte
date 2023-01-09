<script>
  import ApplyForm from '$lib/forms/ApplyForm.svelte'
  import RegistrationForm from '$lib/forms/RegistrationForm.svelte'
  let isRegistration = false
</script>

<div class="grid md:grid-cols-3">
  <button
    on:click={() => {
      isRegistration = !isRegistration
    }}
  >
    Toggle form
  </button>
  {#if isRegistration}
    <h1 class="font-bold text-5xl md:text-6xl mb-8">For parents: Register your child</h1>
    <div class="col-span-2 flex flex-col gap-6 items-center">
      <RegistrationForm />
    </div>
  {:else}
    <h1 class="font-bold text-5xl md:text-6xl mb-8">
      For high school students: Apply to be an instructor
    </h1>
    <div class="col-span-2 flex flex-col gap-6 items-center">
      <ApplyForm />
    </div>
  {/if}
</div>
