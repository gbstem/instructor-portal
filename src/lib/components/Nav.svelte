<script>
  import ProfileMenu from './ProfileMenu.svelte'
  import { classNames } from '$lib/utils'
  import { page } from '$app/stores'
  import { onMount } from 'svelte'
  import Brand from './Brand.svelte'
  import { navigating } from '$app/stores'
  import { fade } from 'svelte/transition'
  import { user, db } from '$lib/firebase'
  import AnnouncementsBell from './AnnouncementsBell.svelte'

  export let applicationType

  onMount(() => {
    updateShadow()
  })

  let shadow = false
  let open = false
  $: pathname = $page.url.pathname
  $: if ($navigating) {
    open = false
  }
  $: emailVerified = $user?.emailVerified

  let pages
  $: if (applicationType === 'apply') {
    pages = [
      {
        name: 'Dashboard',
        href: '/dashboard'
      },
      {
        name: 'Apply',
        href: '/apply'
      }
    ]
  } else if (applicationType === 'register') {
    pages = [
      {
        name: 'Dashboard',
        href: '/dashboard'
      },
      {
        name: 'Register',
        href: '/register'
      }
    ]
  } else {
    pages = [
      {
        name: 'Dashboard',
        href: '/dashboard'
      }
    ]
  }

  function updateShadow() {
    shadow = window.pageYOffset !== 0
  }
</script>

<svelte:window on:scroll={updateShadow} />
<nav
  class={classNames(
    'fixed top-0 left-0 z-50 bg-white h-20 flex items-center w-full px-dynamic justify-between transition-all border-b',
    shadow && !open ? 'border-gray-200 shadow-b' : 'border-white'
  )}
>
  <div class="flex items-center gap-8">
    <Brand />
    {#if emailVerified}
      <div class="hidden md:flex items-center gap-3">
        {#each pages as page}
          <a
            class={classNames(
              'rounded-md py-2 px-3 transition-colors',
              pathname === page.href ? 'bg-gray-200' : 'hover:bg-gray-100'
            )}
            href={page.href}
          >
            {page.name}
          </a>
        {/each}
      </div>
    {/if}
  </div>
  <div class="flex items-center gap-2">
    {#if emailVerified}
      <AnnouncementsBell />
    {/if}
    <ProfileMenu class="hidden sm:block" />
    <button
      class="sm:hidden"
      type="button"
      on:click={() => {
        open = !open
      }}
    >
      {#if open}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-8 h-8"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-8 h-8"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
        </svg>
      {/if}
    </button>
  </div>
</nav>
{#if open}
  <div
    class="sm:hidden fixed top-20 left-0 h-[calc(100vh-5rem)] w-screen bg-white z-50 p-dynamic flex flex-col gap-2"
    transition:fade
  >
    {#each pages as page}
      <a
        class={classNames(
          'rounded-md py-2 px-3 transition-colors',
          pathname === page.href ? 'bg-gray-200' : 'hover:bg-gray-100'
        )}
        href={page.href}
      >
        {page.name}
      </a>
    {/each}
    <div class="mt-dynamic">
      <ProfileMenu />
    </div>
  </div>
{/if}
