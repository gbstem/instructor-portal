<script context="module">
  let current
</script>

<script>
  import { classNames, clickOutside } from '$lib/utils'
  import { uniqueId, debounce, kebabCase } from 'lodash-es'
  import { fade } from 'svelte/transition'

  let self
  export let field = {
    value: '',
    error: false
  }
  export let placeholder = ''
  export let name = kebabCase(placeholder)
  export let floating = false
  export let sourceJson = []
  export let required = false
  let className = ''
  export { className as class }
  let open = false
  let selectedIndex = 0
  const sourceNames = sourceJson.map(item => item.name)
  let filteredSourceNames = []

  const filterSourceNames = debounce(givenValue => {
    const lowerCaseValue = givenValue.toLowerCase()
    filteredSourceNames = sourceNames.filter(
      name => name.toLowerCase().indexOf(lowerCaseValue) !== -1
    )
  }, 150)
  $: onOpen(open)
  $: onField(field)

  const id = uniqueId('select-')
  filterSourceNames(field.value)
  function handleInput(e) {
    if (!open) {
      open = true
    }
    selectedIndex = 0
    field.value = e.target.value
    filterSourceNames(field.value)
  }
  function handleKeyDown(e) {
    switch (e.code) {
      case 'Enter':
        e.preventDefault()
        open = false
        field.value = filteredSourceNames[selectedIndex]
        break
      case 'Tab':
        if (open) {
          e.preventDefault()
          open = false
          field.value = filteredSourceNames[selectedIndex]
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (selectedIndex !== 0) {
          --selectedIndex
        }
        break
      case 'ArrowDown':
        e.preventDefault()
        if (selectedIndex !== filteredSourceNames.length - 1) {
          ++selectedIndex
        }
        break
    }
  }
  function handleClick() {
    open = true
  }
  function catchCurrent() {
    if (current && current.id !== id) {
      current.setOpen(false)
    }
    current = {
      id,
      setOpen: value => {
        open = value
      }
    }
  }
  function onOpen() {
    if (open) {
      catchCurrent()
    } else {
      const givenValue = field.value
      if (sourceNames.includes(givenValue)) {
        filteredSourceNames = [givenValue, ...sourceNames.filter(name => name !== givenValue)]
        selectedIndex = 0
      } else {
        field.value = ''
        filterSourceNames(field.value)
      }
    }
  }
  function onField() {
    if (sourceNames.includes(field.value)) {
      if (self) self.setCustomValidity('')
    } else {
      if (self) self.setCustomValidity(' ')
    }
  }
</script>

<div
  class={classNames('relative mt-2', className)}
  use:clickOutside
  on:outclick={() => {
    open = false
  }}
>
  {#if floating}
    <div class="relative">
      <input
        class={classNames(
          'appearance-none block pl-3 pr-9 pt-1 h-12 w-full transition-colors text-gray-900 rounded-md border focus:outline-none peer disabled:bg-white disabled:text-gray-400',
          field.error
            ? 'border-red-300 focus:border-red-600'
            : 'border-gray-300 focus:border-gray-600',
          className
        )}
        type="text"
        placeholder=" "
        value={field.value}
        bind:this={self}
        on:input={handleInput}
        on:keydown={handleKeyDown}
        on:click={handleClick}
        {id}
        {name}
        {required}
        {...$$restProps}
      />
      <label
        class="cursor-text absolute text-gray-500 duration-150 transform -translate-y-4 top-[0.65rem] left-1 text-[0.8rem] leading-none z-10 origin-[0%_0%] bg-white px-2 peer-focus:-translate-y-4 peer-focus:top-[0.65rem] peer-focus:left-1 peer-focus:text-[0.8rem] peer-focus:leading-none peer-placeholder-shown:text-base peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2"
        for={id}
      >
        <span>
          {placeholder}<span class="text-red-500">*</span>
        </span>
      </label>
    </div>
  {:else}
    <label for={id}>
      <span>
        {placeholder}<span class={classNames('text-red-500', !required && 'hidden')}>*</span>
      </span>
    </label>
    <input
      class={classNames(
        'appearance-none block pl-3 pr-9 h-12 w-full transition-colors text-gray-900 rounded-md border border-gray-300 focus:outline-none focus:border-gray-600 placeholder:text-gray-500 disabled:bg-white disabled:text-gray-400 disabled:placeholder:text-gray-400',
        field.error
          ? 'border-red-300 focus:border-red-600'
          : 'border-gray-300 focus:border-gray-600',
        className
      )}
      type="text"
      value={field.value}
      bind:this={self}
      on:input={handleInput}
      on:keydown={handleKeyDown}
      on:click={handleClick}
      {id}
      {name}
      {placeholder}
      {required}
      {...$$restProps}
    />
  {/if}
  <div class="absolute top-0 right-0 pr-2 flex items-center h-12">
    <button
      type="button"
      on:click={() => {
        open = !open
        if (open) {
          self.focus()
        }
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
        />
      </svg>
    </button>
  </div>
  {#if open}
    <div
      class="absolute top-14 left-0 w-full bg-white rounded-md border border-gray-200 shadow-sm py-1 max-h-60 overflow-y-auto overflow-hidden z-20"
      transition:fade={{ duration: 100 }}
    >
      {#if filteredSourceNames.length === 0}
        <div class="text-left py-2 px-6 w-full">Nothing found.</div>
      {:else if filteredSourceNames.length === 1}
        <button
          class="text-left py-2 px-6 w-full transition-colors duration-300 bg-gray-100"
          type="button"
          on:click={() => {
            field.value = filteredSourceNames[0]
            open = false
          }}
        >
          {filteredSourceNames[0]}
        </button>
      {:else}
        {#each filteredSourceNames as name, index}
          <button
            class={classNames(
              'text-left py-2 px-6 w-full transition-colors duration-300',
              index === selectedIndex && 'bg-gray-100'
            )}
            type="button"
            on:click={() => {
              field.value = name
              open = false
            }}
            on:mouseenter={() => {
              selectedIndex = index
            }}
          >
            {name}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  input:not(:required) + label > span > span {
    display: none;
  }
  input:required:disabled + label > span > span {
    color: #fca5a5;
  }
</style>
