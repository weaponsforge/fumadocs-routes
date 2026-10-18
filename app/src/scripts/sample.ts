export const sum = (a: number, b: number): number => a + b

const main = () => {
  const a = sum(1, 2)
  console.log(a)
}

if (process.env.IS_DOCKER) {
  setTimeout(() => {
    main()
  }, 5000)
} else {
  main()
}
