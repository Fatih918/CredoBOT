<script>
    import { onMount } from "svelte";
    import { apiJson } from "../../lib/api.js";
    import { toast } from "../../lib/ui.js";

    let { me } = $props();
    const isOwner = $derived(me?.role === "owner");
    let loading = $state(true);
    let saving = $state(false);
    let settings = $state({ enabled: true, welcomeMessage: "" });
    let faqs = $state([]);
    let title = $state("");
    let keywordsText = $state("");
    let response = $state("");
    let editingId = $state(null);

    onMount(load);

    async function load() {
        loading = true;
        try {
            const [config, faqData] = await Promise.all([
                apiJson("/api/customer-service/settings"),
                apiJson("/api/customer-service/faqs"),
            ]);
            settings = {
                enabled: config.settings?.enabled ?? true,
                welcomeMessage: config.settings?.welcomeMessage ?? "",
            };
            faqs = faqData.faqs || [];
        } catch (error) {
            toast(error.message, "err");
        } finally {
            loading = false;
        }
    }

    async function saveSettings() {
        saving = true;
        try {
            await apiJson("/api/customer-service/settings", {
                method: "PATCH",
                body: JSON.stringify(settings),
            });
            toast("Customer-service settings saved", "ok");
        } catch (error) {
            toast(error.message, "err");
        } finally {
            saving = false;
        }
    }

    function resetForm() {
        title = "";
        keywordsText = "";
        response = "";
        editingId = null;
    }

    function editFaq(faq) {
        editingId = faq.id;
        title = faq.title;
        keywordsText = (faq.keywords || []).join(", ");
        response = faq.response;
    }

    async function saveFaq() {
        const keywords = keywordsText.split(",").map((value) => value.trim()).filter(Boolean);
        const payload = { title, keywords, response, enabled: true };
        try {
            const path = editingId
                ? "/api/customer-service/faqs/" + encodeURIComponent(editingId)
                : "/api/customer-service/faqs";
            await apiJson(path, {
                method: editingId ? "PATCH" : "POST",
                body: JSON.stringify(payload),
            });
            toast(editingId ? "FAQ updated" : "FAQ created", "ok");
            resetForm();
            await load();
        } catch (error) {
            toast(error.message, "err");
        }
    }

    async function toggleFaq(faq) {
        try {
            await apiJson("/api/customer-service/faqs/" + encodeURIComponent(faq.id), {
                method: "PATCH",
                body: JSON.stringify({ enabled: !faq.enabled }),
            });
            await load();
        } catch (error) {
            toast(error.message, "err");
        }
    }

    async function deleteFaq(faq) {
        if (!confirm("Delete FAQ '" + faq.title + "'?")) return;
        try {
            await apiJson("/api/customer-service/faqs/" + encodeURIComponent(faq.id), { method: "DELETE" });
            if (editingId === faq.id) resetForm();
            await load();
            toast("FAQ deleted", "ok");
        } catch (error) {
            toast(error.message, "err");
        }
    }
</script>

{#if loading}
    <div class="text-muted text-sm"><i class="fas fa-spinner spin"></i> Loading customer-service settings…</div>
{:else}
    {#if !isOwner}
        <div class="card p-3 mb-4 text-[.82rem]" style="border-color:rgba(251,191,36,.4);background:rgba(251,191,36,.06);color:#fcd34d">
            <i class="fas fa-eye"></i> Read-only view — only the owner can change customer-service settings.
        </div>
    {/if}

    <div class="grid gap-4">
        <section class="card p-5">
            <div class="font-bold mb-1"><i class="fas fa-comment-dots text-accent"></i> Automation</div>
            <p class="text-muted text-xs mb-4">Controls private-chat customer-service automation. Group welcome and leave messages are not affected.</p>
            <label class="row-item !py-3 mb-4">
                <span class="text-sm font-semibold">Enable customer-service automation</span>
                <input type="checkbox" bind:checked={settings.enabled} disabled={!isOwner} />
            </label>
            <label class="lbl">First-contact welcome message</label>
            <textarea class="field mb-3" rows="6" maxlength="1500" bind:value={settings.welcomeMessage} disabled={!isOwner} placeholder="Leave empty to use the built-in welcome message."></textarea>
            <p class="text-muted text-xs mb-3">Maximum 1,500 characters. Empty uses the built-in Indonesian welcome. FAQ and price-list answers remain separate.</p>
            {#if isOwner}
                <button class="btn btn-primary" onclick={saveSettings} disabled={saving}>
                    <i class="fas fa-save"></i> {saving ? "Saving…" : "Save settings"}
                </button>
            {/if}
        </section>

        <section class="card p-5">
            <div class="flex items-center justify-between gap-3 mb-1">
                <div class="font-bold"><i class="fas fa-circle-question text-accent"></i> Custom FAQ</div>
                <span class="text-muted text-xs">{faqs.length} entries</span>
            </div>
            <p class="text-muted text-xs mb-4">Custom keyword replies for private chats. Price-list requests are reserved for the live Credo Store catalog and cannot be overridden here.</p>

            {#if isOwner}
                <div class="rounded-xl border p-4 mb-5" style="border-color:var(--color-edge)">
                    <div class="font-semibold text-sm mb-3">{editingId ? "Edit FAQ" : "Add FAQ"}</div>
                    <label class="lbl">Title</label>
                    <input class="field mb-3" bind:value={title} maxlength="100" placeholder="Contoh: Metode pembayaran" />
                    <label class="lbl">Keywords (comma-separated)</label>
                    <input class="field mb-3" bind:value={keywordsText} placeholder="qris, pembayaran, transfer" />
                    <label class="lbl">Reply</label>
                    <textarea class="field mb-3" rows="4" bind:value={response} maxlength="1500" placeholder="Jawaban yang akan dikirim bot…" />
                    <div class="flex flex-wrap gap-2">
                        <button class="btn btn-primary" onclick={saveFaq} disabled={!title.trim() || !keywordsText.trim() || !response.trim()}>
                            <i class="fas fa-save"></i> {editingId ? "Update FAQ" : "Add FAQ"}
                        </button>
                        {#if editingId}<button class="btn" onclick={resetForm}>Cancel</button>{/if}
                    </div>
                </div>
            {/if}

            {#if faqs.length === 0}
                <div class="text-muted text-sm py-5 text-center">No custom FAQ entries yet.</div>
            {:else}
                <div class="flex flex-col gap-2">
                    {#each faqs as faq (faq.id)}
                        <article class="row-item !items-start gap-3">
                            <div class="min-w-0 flex-1">
                                <div class="font-semibold text-sm">{faq.title}</div>
                                <div class="text-muted text-xs mt-1">{(faq.keywords || []).join(" · ")}</div>
                                <p class="text-sm mt-2 whitespace-pre-wrap break-words">{faq.response}</p>
                                <span class="text-xs" style:color={faq.enabled ? "var(--color-accent)" : "var(--color-muted)"}>{faq.enabled ? "Enabled" : "Disabled"}</span>
                            </div>
                            {#if isOwner}
                                <div class="flex gap-1 shrink-0">
                                    <button class="btn btn-sm" onclick={() => editFaq(faq)} aria-label="Edit FAQ"><i class="fas fa-pen"></i></button>
                                    <button class="btn btn-sm" onclick={() => toggleFaq(faq)} aria-label="Toggle FAQ"><i class="fas fa-power-off"></i></button>
                                    <button class="btn btn-sm btn-danger" onclick={() => deleteFaq(faq)} aria-label="Delete FAQ"><i class="fas fa-trash"></i></button>
                                </div>
                            {/if}
                        </article>
                    {/each}
                </div>
            {/if}
        </section>
        <section class="card p-4">
            <div class="font-semibold text-sm mb-1"><i class="fas fa-database text-accent"></i> Catalog ownership</div>
            <p class="text-muted text-xs">Product names, active packages, and prices are read from Credo Store's public catalog API. They are intentionally not duplicated or editable in this bot dashboard.</p>
        </section>
    </div>
{/if}
