# Install TapTalkv3 Git Hooks
# Run: .\scripts\install-git-hooks.ps1

$hookSource = ".githooks\pre-push"
$hookDest = ".git\hooks\pre-push"

if (Test-Path $hookDest) {
    Write-Host "Hook already installed."
} else {
    Copy-Item $hookSource $hookDest -Force
    Write-Host "✅ TapTalkv3 push lock installed!"
    Write-Host "   All commits will be blocked from pushing to any repo other than CavenLink-Dev/TapTalkv3"
}
