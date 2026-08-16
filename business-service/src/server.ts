import app from './app';

const PORT = 5002;

app.listen(PORT, () => {
  console.log(`Business Service (deprecated shell) is running on port ${PORT}`);
});
