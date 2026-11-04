// Era Pop release builder.
// Usage (from the repo root): dotnet run --project tools/build-release
// Reads the script order from index.html, bundles Phaser + the game sources into release/game.js
// (game code minified, local names shortened, wrapped in one closure), writes a minified
// release/index.html and copies assets/ as is.
using System.Text;
using System.Text.RegularExpressions;
using NUglify;
using NUglify.JavaScript;

string root = Directory.GetCurrentDirectory();
while (!File.Exists(Path.Combine(root, "index.html")) || !Directory.Exists(Path.Combine(root, "src")))
{
    root = Path.GetDirectoryName(root) ?? throw new Exception("Run inside the era-pop repo.");
}
string outDir = Path.Combine(root, "release");
string html = File.ReadAllText(Path.Combine(root, "index.html"));

string version = Regex.Match(File.ReadAllText(Path.Combine(root, "src", "config.js")), @"version:\s*'([^']+)'").Groups[1].Value;
if (version == "") throw new Exception("No version in src/config.js");

// Script order from index.html.
var srcs = Regex.Matches(html, "<script src=\"([^\"?]+)").Select(m => m.Groups[1].Value).ToList();
var libs = srcs.Where(s => s.StartsWith("lib/")).ToList();
var game = srcs.Where(s => s.StartsWith("src/")).ToList();

// Game code: one closure so top-level names can be shortened too; globals on window stay intact.
// window.ERA_RELEASE hides the in-game version label in the portal build.
var sb = new StringBuilder("(function(){\nwindow.ERA_RELEASE=true;\n");
foreach (var s in game) sb.Append(File.ReadAllText(Path.Combine(root, s))).Append("\n;\n");
sb.Append("})();\n");

var settings = new CodeSettings
{
    LocalRenaming = LocalRenaming.CrunchAll,
    MinifyCode = true,
    PreserveImportantComments = false,
    EvalTreatment = EvalTreatment.Ignore,
};
var min = Uglify.Js(sb.ToString(), settings);
if (min.HasErrors)
{
    foreach (var e in min.Errors) Console.Error.WriteLine(e);
    return 1;
}

// Fresh output folder.
if (Directory.Exists(outDir)) Directory.Delete(outDir, true);
Directory.CreateDirectory(outDir);

var bundle = new StringBuilder();
foreach (var l in libs) bundle.Append(File.ReadAllText(Path.Combine(root, l)).TrimEnd()).Append("\n;\n");
bundle.Append(min.Code);
File.WriteAllText(Path.Combine(outDir, "game.js"), bundle.ToString(), new UTF8Encoding(false));

// index.html: one script tag for the game (external scripts such as the CrazyGames SDK stay), then minified.
string relHtml = Regex.Replace(html, @"\s*<script src=""(?!https?:)[^""]+""></script>", "");
relHtml = relHtml.Replace("</body>", $"<script src=\"game.js?v={version}\"></script>\n</body>");
var htmlMin = Uglify.Html(relHtml, new NUglify.Html.HtmlSettings { RemoveOptionalTags = false });
if (htmlMin.HasErrors)
{
    foreach (var e in htmlMin.Errors) Console.Error.WriteLine(e);
    return 1;
}
File.WriteAllText(Path.Combine(outDir, "index.html"), htmlMin.Code, new UTF8Encoding(false));

// Assets as is (images and audio are already compressed).
void CopyDir(string from, string to)
{
    Directory.CreateDirectory(to);
    foreach (var f in Directory.GetFiles(from))
    {
        string name = Path.GetFileName(f);
        if (name == ".DS_Store" || name == "Thumbs.db") continue;
        File.Copy(f, Path.Combine(to, name));
    }
    foreach (var d in Directory.GetDirectories(from)) CopyDir(d, Path.Combine(to, Path.GetFileName(d)));
}
CopyDir(Path.Combine(root, "assets"), Path.Combine(outDir, "assets"));

long srcBytes = game.Sum(s => new FileInfo(Path.Combine(root, s)).Length);
Console.WriteLine($"Era Pop v{version} -> release/");
Console.WriteLine($"  game code: {srcBytes / 1024} KB -> {Encoding.UTF8.GetByteCount(min.Code) / 1024} KB");
Console.WriteLine($"  game.js:   {new FileInfo(Path.Combine(outDir, "game.js")).Length / 1024} KB (with {string.Join(", ", libs)})");
return 0;
