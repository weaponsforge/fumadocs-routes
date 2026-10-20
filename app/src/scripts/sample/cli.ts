import { sum } from './main.js'

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
