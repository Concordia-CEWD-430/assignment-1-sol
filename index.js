const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");
const qs = require("querystring");

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === "/home") {
    displayHomePage(req, res);
  } else if (pathname === "/post") {
    displaySinglePost(req, res, parsedUrl.query.id);
  } else if (pathname === "/create" && req.method === "GET") {
    displayCreatePage(req, res);
  } else if (pathname === "/create" && req.method === "POST") {
    handleCreatePost(req, res);
  } else if (pathname === "/delete") {
    handleDeletePost(req, res, parsedUrl.query.id);
  } else if (pathname.startsWith("/public/")) {
    // Serve static files (e.g., CSS)
    const filePath = path.join(__dirname, pathname);
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } else {
        res.writeHead(200, { "Content-Type": "text/css" });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

function displayHomePage(req, res) {
  // Read all blog posts and display them on the home page
  const postsPath = path.join(__dirname, "posts");
  fs.readdir(postsPath, (err, files) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Internal Server Error");
      return;
    }

    const postLinks = files
      .map((file) => {
        const postId = path.parse(file).name;
        return `<li><a href="/post?id=${postId}">${postId}</a></li>`;
      })
      .join("");

    const homePage = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Node.js Blog</title>
        <link rel="stylesheet" type="text/css" href="/public/style.css">
      </head>
      <body>
        <h1>Welcome to the Node.js Blog!</h1>
        <ul>${postLinks}</ul>
        <a href="/create">Create a New Post</a>
      </body>
      </html>
    `;

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(homePage);
  });
}

function displaySinglePost(req, res, postId) {
  const postFilePath = path.join(__dirname, "posts", `${postId}.json`);

  fs.readFile(postFilePath, "utf-8", (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Post Not Found");
      return;
    }

    const post = JSON.parse(data);

    const singlePostPage = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${post.title}</title>
        <link rel="stylesheet" type="text/css" href="/public/style.css">
      </head>
      <body>
        <h1>${post.title}</h1>
        <p>Author: ${post.author}</p>
        <p>${post.content}</p>
        <a href="/home">Back to Home</a>
        <br>
        <a href="/delete?id=${postId}">Delete Post</a>
      </body>
      </html>
    `;

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(singlePostPage);
  });
}

function displayCreatePage(req, res) {
  const createPage = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Create a New Post</title>
      <link rel="stylesheet" type="text/css" href="/public/style.css">
    </head>
    <body>
      <h1>Create a New Post</h1>
      <form method="POST" action="/create" class="form-body">
        <label for="title">Title:</label>
        <input type="text" id="title" name="title" required>
        <br>
        <label for="author">Author:</label>
        <input type="text" id="author" name="author" required>
        <br>
        <label for="content">Content:</label>
        <textarea id="content" name="content" required></textarea>
        <br>
        <button type="submit">Create Post</button>
      </form>
      <br>
      <a href="/home">Back to Home</a>
    </body>
    </html>
  `;

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(createPage);
}

function handleCreatePost(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk.toString();
  });

  req.on("end", () => {
    const formData = qs.parse(body);

    // Create a new post object
    const newPost = {
      title: formData.title,
      author: formData.author,
      content: formData.content,
    };

    // Save the new post to a JSON file
    const postId = Date.now().toString();
    const postFilePath = path.join(__dirname, "posts", `${postId}.json`);

    fs.writeFile(postFilePath, JSON.stringify(newPost, null, 2), (err) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error creating post");
      } else {
        res.writeHead(302, { Location: "/home" });
        res.end();
      }
    });
  });
}

function handleDeletePost(req, res, postId) {
  const postFilePath = path.join(__dirname, "posts", `${postId}.json`);

  fs.unlink(postFilePath, (err) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error deleting post");
    } else {
      res.writeHead(302, { Location: "/home" });
      res.end();
    }
  });
}
