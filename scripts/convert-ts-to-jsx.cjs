const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const SRC_DIR = path.resolve(process.cwd(), 'src');
const EXCLUDED_FILES = new Set([
    path.join(SRC_DIR, 'main.jsx'),
    path.join(SRC_DIR, 'App.jsx'),
]);

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...walk(fullPath));
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        if (!/\.tsx?$/.test(entry.name) || /\.d\.ts$/.test(entry.name)) {
            continue;
        }

        files.push(fullPath);
    }

    return files;
}

function getOutputPath(filePath) {
    if (filePath.endsWith('.tsx')) {
        return filePath.slice(0, -4) + '.jsx';
    }

    return filePath.slice(0, -3) + '.js';
}

function rewriteRelativeImports(code) {
    return code.replace(
        /((?:import|export)\s[^'"]*?from\s*['"]|import\s*\(\s*['"])(\.\.?\/[^'"]+?)(\.tsx?|\.d\.ts)(['"]\s*\)?)/g,
        (_, prefix, specifier, extension, suffix) => {
            if (extension === '.tsx') {
                return `${prefix}${specifier}.jsx${suffix}`;
            }

            return `${prefix}${specifier}.js${suffix}`;
        }
    );
}

function convertFile(filePath) {
    const source = fs.readFileSync(filePath, 'utf8');
    const outputPath = getOutputPath(filePath);

    const result = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2020,
            jsx: ts.JsxEmit.Preserve,
        },
        fileName: path.basename(filePath),
        reportDiagnostics: true,
    });

    if (result.diagnostics?.length) {
        const blockingDiagnostics = result.diagnostics.filter(
            (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
        );

        if (blockingDiagnostics.length > 0) {
            const message = ts.formatDiagnosticsWithColorAndContext(blockingDiagnostics, {
                getCanonicalFileName: (name) => name,
                getCurrentDirectory: () => process.cwd(),
                getNewLine: () => '\n',
            });

            throw new Error(`Failed to convert ${filePath}\n${message}`);
        }
    }

    const rewrittenOutput = rewriteRelativeImports(result.outputText);

    fs.writeFileSync(outputPath, rewrittenOutput, 'utf8');
    fs.unlinkSync(filePath);

    return { from: filePath, to: outputPath };
}

function main() {
    const files = walk(SRC_DIR).filter((filePath) => !EXCLUDED_FILES.has(filePath));

    const converted = [];

    for (const filePath of files) {
        converted.push(convertFile(filePath));
    }

    console.log(`Converted ${converted.length} files.`);
}

main();
