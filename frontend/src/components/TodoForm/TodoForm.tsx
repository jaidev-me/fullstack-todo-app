"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Textarea } from "@/components/ui/textarea";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import Tags from "./Tags";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, ReloadIcon } from "@radix-ui/react-icons";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";
import { useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../../config";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { foldersAtom, Todo, todosAtom, userDetails } from "@/lib/recoil/atoms";
import { toast } from "sonner";

export default function TodoForm({
    children,
    todo,
}: {
    children: React.ReactNode;
    todo?: Todo;
}) {
    const setTodos = useSetRecoilState(todosAtom);
    const formSchema = z.object({
        title: z
            .string()
            .nonempty("Title is required")
            .min(3, "Title is too short"),
        description: z.string().optional(),
        priority: z.enum(["1", "2", "3"]),
        parent: z.string().optional(),
        dueDate: z.date().optional(),
        tags: z.array(z.string()).max(5, "You can only have up to 5 tags"),
    });

    const folders = useRecoilValue(foldersAtom);
    const userDetail = useRecoilValue(userDetails);
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: todo?.title || "",
            description: todo?.description || "",
            priority: (todo?.priority?.toString() as "1" | "2" | "3") || "1",
            parent: todo
                ? folders.find((folder) => folder._id === todo.parent)?._id
                : "None",
            dueDate: todo && todo.dueDate ? new Date(todo.dueDate) : undefined,
            tags: todo?.tags || [],
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            setIsLoading(true);
            if (todo) {
                const res = await axios.put(
                    `${BACKEND_URL}/todo/update`,
                    {
                        id: todo._id,
                        ...values,
                        parent: values.parent == "None" ? "" : values.parent,
                        priority: parseInt(values.priority),
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${userDetail.token}`,
                        },
                    }
                );

                toast(res.data.message);
                setOpen(false);
                setTodos((prev) =>
                    prev.map((t) =>
                        t._id === todo._id ? res.data.data.todo : t
                    )
                );
                setIsLoading(false);
                return;
            }

            const res = await axios.post(
                `${BACKEND_URL}/todo/create`,
                {
                    ...values,
                    parent: values.parent === "None" ? "" : values.parent,
                    priority: parseInt(values.priority),
                },
                {
                    headers: {
                        Authorization: `Bearer ${userDetail.token}`,
                    },
                }
            );

            toast(res.data.message);
            setOpen(false);
            setTodos((prev) => [res.data.data.todo, ...prev]);
            setIsLoading(false);
        } catch (error: any) {
            toast(error.response.data.message);
            setIsLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {todo ? "Update Todo" : "Add Todo"}
                    </DialogTitle>
                    <DialogDescription>
                        Make changes. Click save when you are done.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[70vh] p-0">
                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmit)}
                            className="space-y-8 mx-1"
                        >
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Title"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Description"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="priority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Priority</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Priority" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={"1"}>
                                                    Low
                                                </SelectItem>
                                                <SelectItem value={"2"}>
                                                    Medium
                                                </SelectItem>
                                                <SelectItem value={"3"}>
                                                    High
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="tags"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <Tags
                                                defaulTags={form.getValues(
                                                    "tags"
                                                )}
                                                setFormValue={form.setValue}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Due Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant={"outline"}
                                                        className={cn(
                                                            "w-[240px] pl-3 text-left font-normal",
                                                            !field.value &&
                                                                "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? (
                                                            format(
                                                                field.value,
                                                                "PPP"
                                                            )
                                                        ) : (
                                                            <span>
                                                                Pick a date
                                                            </span>
                                                        )}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent
                                                className="w-auto p-0"
                                                align="start"
                                            >
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date < new Date()
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="parent"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Folder</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={
                                                todo?.parent ? todo.parent : "None"
                                            }
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a folder" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value={"None"}>
                                                    None
                                                </SelectItem>
                                                {folders.map((folder) => (
                                                    <SelectItem
                                                        key={folder._id}
                                                        value={folder._id}
                                                    >
                                                        {folder.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button disabled={isLoading}>
                                    {isLoading ? (
                                        <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        "Save Todo"
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
