async function sleepFor(ms) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default sleepFor;
