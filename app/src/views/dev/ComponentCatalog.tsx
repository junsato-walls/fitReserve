"use client"

import { useState } from "react"

import { Button } from "@/components/base/buttons/Button"
import { CopyButton } from "@/components/base/buttons/CopyButton"
import { IconButton } from "@/components/base/buttons/IconButton"
import { LinkButton } from "@/components/base/buttons/LinkButton"

import { Avatar } from "@/components/base/display/Avatar"
import { Badge } from "@/components/base/display/Badge"
import { Card } from "@/components/base/display/Card"
import { Table } from "@/components/base/display/Table"
import { Tabs } from "@/components/base/display/Tabs"
import { Timetable } from "@/components/base/display/Timetable"

import { Alert } from "@/components/base/feedback/Alert"
import { Spinner } from "@/components/base/feedback/Spinner"
import { Toast } from "@/components/base/feedback/Toast"

import { Checkbox } from "@/components/base/forms/Checkbox"
import { CheckboxGroup } from "@/components/base/forms/CheckboxGroup"
import { CommentBox } from "@/components/base/forms/CommentBox"
import { Datepicker } from "@/components/base/forms/Datepicker"
import { Dropdown } from "@/components/base/forms/Dropdown"
import { FileInput } from "@/components/base/forms/FileInput"
import { Input } from "@/components/base/forms/Input"
import { Radio } from "@/components/base/forms/Radio"
import { RadioGroup } from "@/components/base/forms/RadioGroup"
import { Select } from "@/components/base/forms/Select"
import { Textarea } from "@/components/base/forms/Textarea"

import { ArrowLeftIcon } from "@/components/base/icons/ArrowLeft"
import { ArrowRightIcon } from "@/components/base/icons/ArrowRight"
import { DeleteIcon } from "@/components/base/icons/Delete"
import { DownloadIcon } from "@/components/base/icons/Download"
import { EditIcon } from "@/components/base/icons/Edit"

import { Breadcrumb } from "@/components/base/navigation/Breadcrumb"
import { Pagination } from "@/components/base/navigation/Pagination"

import { Banner } from "@/components/base/overlays/Banner"
import { Drawer } from "@/components/base/overlays/Drawer"
import { Loading } from "@/components/base/overlays/Loading"
import { Modal } from "@/components/base/overlays/Modal"
import { Tooltip } from "@/components/base/overlays/Tooltips"

import { Header } from "@/components/layouts/Header"
import { ThemeToggle } from "@/components/layouts/ThemeToggle"

/** 節の見出しと中身をまとめる */
const Section = ({
    title,
    note,
    children,
}: {
    title: string
    note?: string
    children: React.ReactNode
}) => (
    <section className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
        {note && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{note}</p>}
        <div className="mt-4 space-y-6">{children}</div>
    </section>
)

/** 1つの見本。ラベル付きで横に並べる */
const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">{label}</p>
        <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
)

type SampleRow = { id: number; name: string; store: string; status: string }

const TABLE_ROWS: SampleRow[] = [
    { id: 1, name: "山田 太郎", store: "渋谷店", status: "予約確定" },
    { id: 2, name: "佐藤 花子", store: "新宿店", status: "予約受付" },
    { id: 3, name: "鈴木 次郎", store: "横浜店", status: "採寸完了" },
]

export const ComponentCatalog = () => {
    const [text, setText] = useState("")
    const [checked, setChecked] = useState(true)
    const [radio, setRadio] = useState("a")
    const [select, setSelect] = useState("shibuya")
    const [page, setPage] = useState(2)
    const [modalOpen, setModalOpen] = useState(false)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [toastOpen, setToastOpen] = useState(true)

    return (
        <div className="min-h-screen px-8 py-10">
            <div className="max-w-4xl mx-auto space-y-10">
                <header className="flex flex-wrap items-start justify-between gap-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            base コンポーネントカタログ
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            ライト／ダーク両方の見え方を確認するための開発用画面。本番ビルドでは表示されない。
                        </p>
                    </div>
                    <div className="w-64">
                        <ThemeToggle />
                    </div>
                </header>

                <Section title="buttons" note="操作を促す部品">
                    <Row label="Button / tone（用途の色）">
                        <Button label="info" tone="info" />
                        <Button label="neutral" tone="neutral" />
                        <Button label="success" tone="success" />
                        <Button label="warning" tone="warning" />
                        <Button label="danger" tone="danger" />
                    </Row>
                    <Row label="Button / variant（見た目の型）">
                        <Button label="filled" variant="filled" />
                        <Button label="outlined" variant="outlined" />
                        <Button label="soft" variant="soft" />
                        <Button label="ghost" variant="ghost" />
                    </Row>
                    <Row label="Button / size">
                        <Button label="sm" size="sm" />
                        <Button label="md" size="md" />
                        <Button label="lg" size="lg" />
                    </Row>
                    <Row label="Button / state">
                        <Button label="通常" />
                        <Button label="無効" disabled />
                        <Button label="送信" isLoading loadingLabel="送信中..." />
                        <Button label="選択中" selected />
                    </Row>
                    <Row label="IconButton / CopyButton / LinkButton">
                        <IconButton icon={<EditIcon size="sm" />} srLabel="編集" />
                        <IconButton
                            icon={<DeleteIcon size="sm" />}
                            srLabel="削除"
                            variant="outlined"
                        />
                        <IconButton
                            icon={<DownloadIcon size="sm" />}
                            srLabel="保存"
                            tone="neutral"
                            variant="ghost"
                        />
                        <CopyButton text="コピーされる文字列" />
                        <LinkButton href="#">リンクボタン</LinkButton>
                    </Row>
                </Section>

                <Section
                    title="forms"
                    note="入力を受け取る部品。同じ size で高さが揃うかを確認する"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="テキスト"
                            placeholder="入力してください"
                            fullWidth
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        <Select
                            label="店舗"
                            fullWidth
                            value={select}
                            onChange={(value) => setSelect(value)}
                            options={[
                                { value: "shibuya", label: "渋谷店" },
                                { value: "shinjuku", label: "新宿店" },
                                { value: "yokohama", label: "横浜店" },
                            ]}
                        />
                        <Input label="エラー時" fullWidth error="必須項目です" required />
                        <Select
                            label="補足付き"
                            fullWidth
                            helperText="空き枠のある店舗のみ表示"
                            options={[{ value: "shibuya", label: "渋谷店" }]}
                        />
                    </div>
                    <Textarea label="備考" fullWidth placeholder="自由記述" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Datepicker label="予約日" helperText="yyyy-mm-dd" />
                        <FileInput label="ファイル" fullWidth />
                    </div>
                    <Row label="Checkbox / Radio">
                        <Checkbox
                            label="同意する"
                            checked={checked}
                            onChange={(e) => setChecked(e.target.checked)}
                        />
                        <Checkbox label="無効" disabled />
                        <Radio
                            label="選択肢A"
                            name="sample"
                            value="a"
                            checked={radio === "a"}
                            onChange={() => setRadio("a")}
                        />
                        <Radio
                            label="選択肢B"
                            name="sample"
                            value="b"
                            checked={radio === "b"}
                            onChange={() => setRadio("b")}
                        />
                    </Row>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CheckboxGroup label="オプション" required>
                            <Checkbox label="採寸データを保存する" />
                            <Checkbox label="メールで控えを受け取る" />
                        </CheckboxGroup>
                        <RadioGroup label="来店方法" error="選択してください">
                            <Radio label="徒歩" name="how" value="walk" />
                            <Radio label="車" name="how" value="car" />
                        </RadioGroup>
                    </div>
                    <CommentBox placeholder="コメントを入力" />
                    <Row label="Dropdown">
                        <Dropdown
                            placeholder="操作を選ぶ"
                            items={[
                                { id: "edit", label: "編集", value: "edit" },
                                { id: "delete", label: "削除", value: "delete" },
                                { id: "disabled", label: "無効な項目", value: "x", disabled: true },
                            ]}
                        />
                    </Row>
                </Section>

                <Section title="display" note="データの見せ方を決める部品">
                    <Row label="Badge / tone">
                        <Badge tone="neutral">未設定</Badge>
                        <Badge tone="info">予約確定</Badge>
                        <Badge tone="success">採寸完了</Badge>
                        <Badge tone="warning">予約受付</Badge>
                        <Badge tone="danger">キャンセル</Badge>
                    </Row>
                    <Row label="Avatar">
                        <Avatar size="sm" fallback="山" />
                        <Avatar size="md" fallback="佐" />
                        <Avatar size="lg" fallback="鈴" />
                    </Row>
                    <Card title="Card（title 付き）">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                            カードの本文。背景と枠線がテーマに追従するかを確認する。
                        </p>
                    </Card>
                    <div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
                            Table
                        </p>
                        <Table<SampleRow>
                            data={TABLE_ROWS}
                            getRowId={(row) => row.id}
                            emptyMessage="データがありません"
                            columns={[
                                { id: "name", header: "顧客名", accessor: "name" },
                                { id: "store", header: "店舗", accessor: "store" },
                                {
                                    id: "status",
                                    header: "ステータス",
                                    accessor: "status",
                                    type: "badge",
                                },
                            ]}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
                            Timetable（ドラッグで移動、空き時間のドラッグで新規作成）
                        </p>
                        <Timetable
                            startHour={10}
                            endHour={14}
                            columns={[
                                { id: 1, label: "渋谷店", description: "2件" },
                                { id: 2, label: "新宿店", description: "1件" },
                            ]}
                            items={[
                                {
                                    id: 1,
                                    columnId: 1,
                                    start: "10:00",
                                    end: "11:30",
                                    title: "空き2／3",
                                    tone: "success",
                                },
                                {
                                    id: 2,
                                    columnId: 1,
                                    start: "12:30",
                                    end: "13:00",
                                    title: "満席",
                                    tone: "danger",
                                    locked: true,
                                    lockedReason: "予約が入っている枠は移動できません",
                                },
                                {
                                    id: 3,
                                    columnId: 2,
                                    start: "11:00",
                                    end: "12:00",
                                    title: "受付停止",
                                    tone: "neutral",
                                },
                            ]}
                            onMove={() => {}}
                            onCreate={() => {}}
                            onSelect={() => {}}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-2">
                            Tabs
                        </p>
                        <Tabs
                            tabs={[
                                {
                                    id: "a",
                                    label: "予約情報",
                                    content: <p>予約情報の中身</p>,
                                },
                                {
                                    id: "b",
                                    label: "採寸結果",
                                    content: <p>採寸結果の中身</p>,
                                },
                            ]}
                        />
                    </div>
                </Section>

                <Section title="feedback" note="状態や結果を伝える部品">
                    <Alert tone="info" message="情報メッセージです。" />
                    <Alert tone="success" message="保存しました。" />
                    <Alert tone="warning" message="空き枠が残りわずかです。" />
                    <Alert tone="danger" message="予約の作成に失敗しました。" />
                    <Row label="Spinner">
                        <Spinner size="sm" />
                        <Spinner size="md" />
                        <Spinner size="lg" />
                    </Row>
                    {toastOpen && (
                        <Toast
                            message="Toast の表示例"
                            type="success"
                            onClose={() => setToastOpen(false)}
                            duration={0}
                        />
                    )}
                </Section>

                <Section title="navigation" note="移動と現在位置を示す部品">
                    <Breadcrumb
                        items={[
                            { label: "ホーム", href: "/" },
                            { label: "スタッフ", href: "/staff" },
                            { label: "予約一覧", current: true },
                        ]}
                    />
                    <Pagination currentPage={page} totalPages={8} onPageChange={setPage} />
                </Section>

                <Section
                    title="overlays"
                    note="重ねて表示する部品。開いた状態で背景と文字色を確認する"
                >
                    <Banner message="お知らせ用のバナーです。" />
                    <Row label="Tooltip">
                        <Tooltip content="ツールチップの中身">
                            <Button label="ホバーして確認" variant="outlined" />
                        </Tooltip>
                    </Row>
                    <Row label="Modal / Drawer / Loading">
                        <Button label="Modal を開く" onClick={() => setModalOpen(true)} />
                        <Button
                            label="Drawer を開く"
                            tone="neutral"
                            variant="outlined"
                            onClick={() => setDrawerOpen(true)}
                        />
                    </Row>
                    <div className="relative h-32 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        <Loading />
                    </div>
                    <Modal open={modalOpen} onOpenChange={setModalOpen} title="Modal の見本">
                        <p className="text-sm text-gray-700 dark:text-gray-200">
                            背景・枠線・閉じるボタンがテーマに追従するかを確認する。
                        </p>
                    </Modal>
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Drawer の見本">
                        <p className="text-sm text-gray-700 dark:text-gray-200">Drawer の本文。</p>
                    </Drawer>
                </Section>

                <Section
                    title="icons"
                    note="currentColor で親から色を継承するため dark: 指定を持たない"
                >
                    <Row label="size=md">
                        <ArrowLeftIcon />
                        <ArrowRightIcon />
                        <EditIcon />
                        <DeleteIcon />
                        <DownloadIcon />
                    </Row>
                </Section>

                <Section title="layouts" note="画面の外枠。base ではなく components/layouts に置く">
                    <Row label="Header（lg以上=アバター / lg未満=ハンバーガー）">
                        <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-visible">
                            <Header userName="山田 太郎" personalId="yamada001" />
                        </div>
                    </Row>
                </Section>
            </div>
        </div>
    )
}
